package server

import (
	"encoding/json"
	"errors"
	"mime/multipart"
	"strconv"
	"time"

	"fmt"
	"log"
	"net/http"
	"sgs/internal/config"
	"sgs/internal/models"
	"sgs/internal/repository"
	"sgs/internal/store"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// errors
var (
	ErrFileOwnership = errors.New("not authorized owner of this file")
)

// FileHandler provides functionality for managing a File
type FileHandler struct {
	cfg         *config.Config
	fileRepo    *repository.FileRepository
	projectRepo *repository.ProjectRepository
	store       *store.Store
}

// NewFileHandler creates a new File handler
func NewFileHandler(cfg *config.Config, fileRepo *repository.FileRepository, projectRepo *repository.ProjectRepository, store *store.Store) *FileHandler {
	return &FileHandler{
		cfg:         cfg,
		fileRepo:    fileRepo,
		projectRepo: projectRepo,
		store:       store,
	}
}

// UploadFile creates a new File
func (s *FileHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	// get logged-in user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	// get project id
	projectID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid project ID"})
		return
	}

	// parse the request body
	file, header, err := r.FormFile("file")
	if err != nil {
		log.Printf("failed to extract file in multipart form: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to upload file"})
		return
	}
	defer file.Close()

	// get file content type
	contentType, err := s.detectContentType(file)
	if err != nil {
		log.Printf("failed to extract content type from file: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to upload file"})
		return
	}

	// upload file to store and save metadata in db in a two-phase commit
	tx, err := s.fileRepo.GetTx(r.Context())
	if err != nil {
		log.Printf("failed to start db transaction: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to upload file"})
		return
	}
	// rollback if not committed
	defer tx.Rollback()

	// verify that project exists
	project, err := s.projectRepo.GetProjectByIDTx(r.Context(), tx, projectID)
	if err != nil {
		if err == repository.ErrProjectNotFound {
			s.sendResponse(w, http.StatusNotFound, models.APIResponse{Message: err.Error()})
			return
		}
		log.Printf("failed to retrieve file's project: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to upload file"})
		return
	}

	// generate filename
	objectName := s.generateObjectName(project.Bucket, header.Filename)

	// compose metadata
	metadata := models.File{Filename: header.Filename, ObjectName: objectName, ProjectID: projectID, Size: header.Size, ContentType: contentType, UploadedBy: userID}

	//  save bucket details in db
	f, err := s.fileRepo.CreateFile(r.Context(), tx, metadata.Filename, metadata.ObjectName, metadata.ProjectID, metadata.Size, metadata.ContentType, metadata.UploadedBy)
	if err != nil {
		log.Printf("failed to save project in db: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	// stream file into store object
	object, err := s.store.CreateObject(r.Context(), project.Bucket, f.ObjectName, f.ContentType, header.Size, file)
	if err != nil {
		log.Printf("failed to stream project into store: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}
	log.Printf("new object uploaded into the store: %v\n", object)

	// commit transaction
	if err := tx.Commit(); err != nil {
		log.Printf("failed to start commit transaction. Removing saved object in store now...: %v\n", err)
		// remove saved bucket
		if err = s.store.RemoveObject(r.Context(), object.Bucket, object.Name); err != nil {
			log.Printf("failed to remove saved object in store: %v\n", err)
		}
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to upload file"})
		return
	}

	s.sendResponse(w, http.StatusCreated, models.APIResponse{Message: "File uploaded successfully", Data: f})
}

func (s *FileHandler) DownloadFileHandler(w http.ResponseWriter, r *http.Request) {
	// get the file id
	fileID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid file ID"})
		return
	}
	// get logged-in user
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	// retrieve file metadata from store and verify ownership
	fileMeta, err := s.fileRepo.GetFileByID(r.Context(), fileID)
	if err != nil {
		if err == repository.ErrFileNotFound {
			s.sendResponse(w, http.StatusNotFound, models.APIResponse{Message: err.Error()})
			return
		}
		log.Printf("failed to retrieve file: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to download file"})
		return
	}
	if fileMeta.UploadedBy != userID {
		log.Printf("Denied unauthorized user from accessing private file: %v\n", err)
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Failed to download file"})
		return
	}

	// retrieve file from store
	err = s.store.GetObject(r.Context(), *fileMeta.Bucket, fileMeta.ObjectName, w)
	if err != nil {
		log.Printf("Failed to copy object to be downloaded into response writer: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to download file"})
		return
	}

	// write the appropriate headers
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s;", fileMeta.Filename))
	w.Header().Set("Content-Type", fileMeta.ContentType)
	w.Header().Set("Content-Length", strconv.FormatInt(fileMeta.Size, 10))
}

// GenerateSignedURLRequest represents the signed url creation payload
type GenerateSignedURLRequest struct {
	ExpiresAt time.Time `json:"expiresAt"`
}

type GenerateSignedURLResponse struct {
	DownloadURL string `json:"downloadUrl"`
}

// validate register request
func (data *GenerateSignedURLRequest) validate() error {
	if data.ExpiresAt.IsZero() {
		return fmt.Errorf("link expiry is required")
	}

	if data.ExpiresAt.IsZero() {
		return fmt.Errorf("expiry time is required")
	}

	// convert ExpiresAt to UTC for comparison
	expiresAt := data.ExpiresAt.UTC()

	// current utc time for validation
	now := time.Now().UTC()

	// check if expiry is in the past
	if expiresAt.Before(now) {
		return fmt.Errorf("expiry time must be in the future")
	}

	// check if expiry is too far in the future: 1 year maximum
	// maxExpiry := now.AddDate(1, 0, 0)
	// if expiresAt.After(maxExpiry) {
	// 	return fmt.Errorf("expiry time cannot be more than 1 year from now")
	// }

	// check minimum expiry: 5 minutes
	minExpiry := now.Add(5 * time.Minute)
	if expiresAt.Before(minExpiry) {
		return fmt.Errorf("expiry time must be at least 1 hour from now")
	}

	return nil
}

// GenerateSignedURLHandler generates a new signed url for a given file
func (s *FileHandler) GenerateSignedURLHandler(w http.ResponseWriter, r *http.Request) {
	// get the file id
	fileID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid file ID"})
		return
	}
	// parse the request body
	var req GenerateSignedURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid request payload: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Invalid request payload"})
		return
	}
	// Validate input
	if err := req.validate(); err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: err.Error()})
		return
	}

	// retrieve the associated file
	file, err := s.fileRepo.GetFileByID(r.Context(), fileID)
	if err != nil {
		if err == repository.ErrFileNotFound {
			s.sendResponse(w, http.StatusNotFound, models.APIResponse{Message: err.Error()})
			return
		}
		log.Printf("failed to retrieve file: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to generate signed url"})
		return
	}

	// generate token
	token, err := s.generateSignedURL(file, req.ExpiresAt)
	if err != nil {
		log.Printf("failed to generate signed url: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to generate signed url"})
		return
	}

	// compose url
	signedURL := s.cfg.BaseURL.JoinPath("/api/files/download-signed")
	query := signedURL.Query()
	query.Set("token", token)
	signedURL.RawQuery = query.Encode()

	s.sendResponse(w, http.StatusCreated, models.APIResponse{Message: "Signed URL generated successfully", Data: GenerateSignedURLResponse{DownloadURL: signedURL.String()}})
}

func (s *FileHandler) DownloadSignedFileHandler(w http.ResponseWriter, r *http.Request) {
	// extract token and validate jwt
	token := r.URL.Query().Get("token")
	if token == "" {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "File not found"})
		return
	}

	content, err := s.validateSignedURL(token)
	if err != nil {
		if err == jwt.ErrTokenExpired {
			s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "File download link is no longer valid. Generate a new one"})
			return
		}

		log.Printf("failed to validate presigned url token: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Invalid download link"})
		return
	}

	// retrieve file metadata from store and verify ownership
	fileMeta, err := s.fileRepo.GetFileByID(r.Context(), content.FileID)
	if err != nil {
		if err == repository.ErrFileNotFound {
			s.sendResponse(w, http.StatusNotFound, models.APIResponse{Message: err.Error()})
			return
		}
		log.Printf("failed to retrieve file: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to download file"})
		return
	}

	// retrieve file from store
	err = s.store.GetObject(r.Context(), *fileMeta.Bucket, fileMeta.ObjectName, w)
	if err != nil {
		log.Printf("Failed to copy object to be downloaded into response writer: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to download file"})
		return
	}

	// write the appropriate headers
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s;", fileMeta.Filename))
	w.Header().Set("Content-Type", fileMeta.ContentType)
	w.Header().Set("Content-Length", strconv.FormatInt(fileMeta.Size, 10))
}

// ====== FILE METADATA HANDLERS =====

// GetFileMeta retrieves the metadata for a single file
func (s *FileHandler) GetFileMeta(w http.ResponseWriter, r *http.Request) {
	// get file id
	params := mux.Vars(r)
	id := params["id"]
	fileID, err := uuid.Parse(id)
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid file ID"})
		return
	}

	//  get file metadata in db
	file, err := s.fileRepo.GetFileByID(r.Context(), fileID)
	if err != nil {
		if err == repository.ErrFileNotFound {
			s.sendResponse(w, http.StatusNotFound, models.APIResponse{Message: err.Error()})
			return
		}
		log.Printf("failed to retrieve file: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to retrieve file"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "File retrieved successfully", Data: file})
}

// GetProjectFilesMeta retrieves the metadata for a all files in a project
func (s *FileHandler) GetProjectFilesMeta(w http.ResponseWriter, r *http.Request) {
	// get file id
	params := mux.Vars(r)
	pID := params["id"]
	projectID, err := uuid.Parse(pID)
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid project ID"})
		return
	}

	//  get files metadata in db
	files, err := s.fileRepo.GetFiles(r.Context(), &projectID)
	if err != nil {
		log.Printf("failed to retrieve files: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "Files retrieved successfully", Data: files})
}

// GetUserFilesMeta creates a new File
func (s *FileHandler) GetUserFilesMeta(w http.ResponseWriter, r *http.Request) {
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	//  get user file metadata in db
	files, err := s.fileRepo.GetFilesByOwnerID(r.Context(), userID)
	if err != nil {
		log.Printf("failed to retrieve files: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "Files retrieved successfully", Data: files})
}

// DeleteFile deletes a file and its metadata
func (s *FileHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	// get the file id
	params := mux.Vars(r)
	id := params["id"]
	fileID, err := uuid.Parse(id)
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid File ID"})
		return
	}

	// run operation atomically in a transaction in a 2-phase commit
	tx, err := s.fileRepo.GetTx(r.Context())
	if err != nil {
		log.Printf("failed to start db transaction: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "failed to delete file"})
	}
	// rollback if transaction is not committed
	defer tx.Rollback()

	// phase 2

	// retrieve file
	file, err := s.fileRepo.GetFileByIDTx(r.Context(), tx, fileID)
	if err != nil {
		log.Printf("failed to retrieve file: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	//  delete file without committing
	if err := s.fileRepo.DeleteFileByID(r.Context(), tx, fileID); err != nil {
		if err == repository.ErrFileNotFound {
			s.sendResponse(w, http.StatusNotFound, models.APIResponse{Message: err.Error()})
			return
		}
		log.Printf("failed to delete File: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "failed to delete File"})
		return
	}

	// delete file in store as object
	if err := s.store.RemoveObject(r.Context(), *file.Bucket, file.ObjectName); err != nil {
		log.Printf("failed to remove bucket from store: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to delete File"})
		return
	}

	// phase 3: commit transaction
	if err := tx.Commit(); err != nil {
		log.Printf("failed to commit transaction: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to delete file"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "File deleted successfully"})
}

// helper methods

// detectContentType reads the content type of the uploaded file
func (s *FileHandler) detectContentType(file multipart.File) (string, error) {
	// snip the content type from the first 512 bytes
	buf := make([]byte, 512)
	if _, err := file.Read(buf); err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	// Reset file pointer
	if _, err := file.Seek(0, 0); err != nil {
		return "", fmt.Errorf("failed to reset file pointer: %w", err)
	}

	return http.DetectContentType(buf), nil
}

// generateObjectName returns a new name for the object in the format: <bucket-uuid-filename>
func (s *FileHandler) generateObjectName(bucketName string, filename string) string {
	return fmt.Sprintf("%s-%s-%s", bucketName, uuid.New().String(), filename)
}

func (s *FileHandler) sendResponse(w http.ResponseWriter, status int, resp models.APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// signed url helpers

// generateSignedURL creates a new signed url for a given file
func (s *FileHandler) generateSignedURL(file *models.File, expiresAt time.Time) (string, error) {
	// set expiration time and claims with timestamps in unix format
	claims := jwt.MapClaims{
		"sub":    file.ID.String(),
		"bucket": file.Bucket,
		"exp":    expiresAt.Unix(),
		"iat":    time.Now().Unix(),
	}

	// generate token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// sign token with secret key
	tokenString, err := token.SignedString([]byte(s.cfg.JwtSecret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// validateSignedURL verifies a signedURL token and returns the contents of the signed url. [ErrExpiredToken] is returned if the token
// has expired or [ErrInvalidToken] if the token validation failed
func (s *FileHandler) validateSignedURL(tokenString string) (*models.SignedURLContent, error) {
	// parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(s.cfg.JwtSecret), nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, err
	}

	// extract and validate claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	content := &models.SignedURLContent{}
	fileID, ok := claims["sub"].(string)
	if !ok {
		return nil, ErrInvalidToken
	}
	if content.Bucket, ok = claims["bucket"].(string); !ok {
		return nil, ErrInvalidToken
	}

	// parse content id
	content.FileID, err = uuid.Parse(fileID)
	if err != nil {
		return nil, ErrInvalidToken
	}

	return content, nil
}
