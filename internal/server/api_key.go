package server

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sgs/internal/models"
	"sgs/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// errors
var (
	ErrAPIKeyInUse           = errors.New("API Key already exists")
	ErrAPIKeyAccessForbidden = errors.New("forbidden access. You don't have access to this API key")
)

// APIKeyHandler provides functionality for managing a APIKey
type APIKeyHandler struct {
	apiKeyRepo *repository.APIKeyRepository
}

// NewAPIKeyHandler creates a new APIKey handler
func NewAPIKeyHandler(apiKeyRepo *repository.APIKeyRepository) *APIKeyHandler {
	return &APIKeyHandler{
		apiKeyRepo: apiKeyRepo,
	}
}

// CreateAPIKeyRequest represents the registration payload
type CreateAPIKeyRequest struct {
	Name      string    `json:"name"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// validate register request
func (data *CreateAPIKeyRequest) validate() error {
	if data.Name == "" || data.ExpiresAt.IsZero() {
		return fmt.Errorf("token name and expiry are required")
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
	maxExpiry := now.AddDate(1, 0, 0)
	if expiresAt.After(maxExpiry) {
		return fmt.Errorf("expiry time cannot be more than 1 year from now")
	}

	// check minimum expiry: 1 hour
	minExpiry := now.Add(time.Hour)
	if expiresAt.Before(minExpiry) {
		return fmt.Errorf("expiry time must be at least 1 hour from now")
	}

	return nil
}

// CreateAPIKey creates a new APIKey
func (s *APIKeyHandler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	// get the project id
	projectID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid project ID"})
		return
	}

	// parse the request body
	var req CreateAPIKeyRequest
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

	// generate token
	token, err := s.generateAPIKey("sgs", req.Name, projectID)
	if err != nil {
		log.Printf("failed to generate API key: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to generate API key"})
		return
	}

	//  save bucket details in db
	APIKey, err := s.apiKeyRepo.CreateAPIKey(r.Context(), token, req.Name, projectID, userID, req.ExpiresAt)
	if err != nil {
		log.Printf("failed to save API key in db: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	s.sendResponse(w, http.StatusCreated, models.APIResponse{Message: "API key created successfully", Data: APIKey})
}

// GetAPIKey retrieves a single APIKey by token
func (s *APIKeyHandler) GetAPIKeyByToken(w http.ResponseWriter, r *http.Request) {
	// get the APIKey id
	id, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid APIKey ID"})
		return
	}
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	apiKey, err := s.apiKeyRepo.GetAPIKeyByID(r.Context(), id)
	if err != nil {
		log.Printf("failed to retrieve APIKey: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	// verify that key owner legitimacy
	if apiKey.UserID != userID {
		log.Printf("Forbidden api key access: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: ErrAPIKeyAccessForbidden.Error()})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "API key retrieved successfully", Data: apiKey})
}

// GetAPIKey retrieves a single APIKey
func (s *APIKeyHandler) GetAPIKey(w http.ResponseWriter, r *http.Request) {
	// get the APIKey id
	id, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid APIKey ID"})
		return
	}
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	apiKey, err := s.apiKeyRepo.GetAPIKeyByID(r.Context(), id)
	if err != nil {
		log.Printf("failed to retrieve APIKey: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	// verify that key owner legitimacy
	if apiKey.UserID != userID {
		log.Printf("Forbidden api key access: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: ErrAPIKeyAccessForbidden.Error()})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "API key retrieved successfully", Data: apiKey})
}

// GetProjectAPIKeys retrieves APIKeys belonging to a project
func (s *APIKeyHandler) GetProjectAPIKeys(w http.ResponseWriter, r *http.Request) {
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}
	// get the project id
	projectID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid project ID"})
		return
	}

	APIKeys, err := s.apiKeyRepo.GetAPIKeysByProjectID(r.Context(), projectID, userID)
	if err != nil {
		log.Printf("failed to retrieve API Keys: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to retrieve API keys"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "API keys retrieved successfully", Data: APIKeys})
}

// GetUserAPIKeys retrieves APIKeys belonging to a user
func (s *APIKeyHandler) GetUserAPIKeys(w http.ResponseWriter, r *http.Request) {
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	APIKeys, err := s.apiKeyRepo.GetAPIKeysByUserID(r.Context(), userID)
	if err != nil {
		log.Printf("failed to retrieve API Keys: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Failed to retrieve API keys"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "API keys retrieved successfully", Data: APIKeys})
}

// RevokeAPIKey revokes an APIKey
func (s *APIKeyHandler) RevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	// get the APIKey id
	params := mux.Vars(r)
	id := params["id"]
	apiKeyID, err := uuid.Parse(id)
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid APIKey ID"})
		return
	}
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	if err := s.apiKeyRepo.RevokeAPIKey(r.Context(), apiKeyID, userID); err != nil {
		if err == repository.ErrAPIKeyNotFound {
			s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "API key not found"})
			return
		}
		log.Printf("failed to revoke API Key: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "failed to revoke API key"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "API key revoked successfully"})
}

// DeleteAPIKey delete a APIKey
func (s *APIKeyHandler) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	// get the APIKey id
	params := mux.Vars(r)
	id := params["id"]
	apiKeyID, err := uuid.Parse(id)
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid APIKey ID"})
		return
	}
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	if err := s.apiKeyRepo.DeleteAPIKey(r.Context(), apiKeyID, userID); err != nil {
		if err == repository.ErrAPIKeyNotFound {
			s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "API key not found"})
			return
		}
		log.Printf("failed to delete API Key: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "failed to delete API key"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "API key deleted successfully"})
}

func (s *APIKeyHandler) sendResponse(w http.ResponseWriter, status int, resp models.APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// helper methods

func (s *APIKeyHandler) generateAPIKey(prefix, name string, projectID uuid.UUID) (string, error) {
	// create a random salt of length 32 - len(prefix)
	salt := make([]byte, 32-len(prefix))
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate random salt: %w", err)
	}

	// combine element with salt
	raw := append([]byte(projectID.String()), salt...)
	raw = append(raw, []byte(name)...)

	// create hash
	hash := sha256.New()
	hash.Write(raw)
	hashBytes := hash.Sum(nil)

	// create final token in base64 encoding and limit token length to 32
	token := fmt.Sprintf("%s_%s", prefix, base64.URLEncoding.EncodeToString(hashBytes))
	if len(token) > 32 {
		token = token[:32]
	}
	return token, nil
}
