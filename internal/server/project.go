package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sgs/internal/models"
	"sgs/internal/repository"
	"sgs/internal/store"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// errors
var (
	ErrProjectNotFound = errors.New("project not found")
	ErrProjectInUse    = errors.New("project already exists")
)

// ProjectHandler provides functionality for managing a project
type ProjectHandler struct {
	projectRepo *repository.ProjectRepository
	store       *store.Store
}

// NewProjectHandler creates a new Project handler
func NewProjectHandler(projectRepo *repository.ProjectRepository, store *store.Store) *ProjectHandler {
	return &ProjectHandler{
		projectRepo: projectRepo,
		store:       store,
	}
}

// CreateProjectRequest represents the registration payload
type CreateProjectRequest struct {
	OwnerID uuid.UUID `json:"ownerId"`
	Bucket  string    `json:"bucket"`
}

// validate register request
func (data *CreateProjectRequest) validate() error {
	if data.OwnerID.String() == "" || data.Bucket == "" {
		return fmt.Errorf("owner id and bucket are required")
	}
	// parse owner id as uuid
	// if _, ok
	return nil
}

// CreateProject creates a new project
func (s *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	// parse the request body
	var req CreateProjectRequest
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

	// start transaction to ensure that bucket creation and project saving is atomic
	tx, err := s.projectRepo.GetTx(r.Context())
	if err != nil {
		log.Printf("failed to start db transaction: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to create project"})
		return
	}
	// rollback if not committed
	defer tx.Rollback()

	//  save bucket details in db
	project, err := s.projectRepo.CreateProject(r.Context(), tx, req.OwnerID, req.Bucket)
	if err != nil {
		log.Printf("failed to save project in db: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	// create bucket in store
	if err := s.store.CreateBucket(r.Context(), req.Bucket, false); err != nil {
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	// commit transaction
	if err := tx.Commit(); err != nil {
		log.Printf("failed to start commit transaction. Removing saved bucket in store now...: %v\n", err)
		// remove saved bucket
		if err = s.store.RemoveBucket(r.Context(), req.Bucket); err != nil {
			log.Printf("failed to remove saved bucket in store: %v\n", err)
		}
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to create project"})
		return
	}

	s.sendResponse(w, http.StatusCreated, models.APIResponse{Message: "Project created successfully", Data: project})
}

// GetUserProjects retrieves projects belonging to a user
func (s *ProjectHandler) GetUserProjects(w http.ResponseWriter, r *http.Request) {
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	//  get user projects in db
	projects, err := s.projectRepo.GetProjectsByOwnerID(r.Context(), userID)
	if err != nil {
		log.Printf("failed to retrieve projects: %v\n", err)
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: err.Error()})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "Project retrieved successfully", Data: projects})
}

// DeleteProject delete a project
func (s *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	// get the project id
	params := mux.Vars(r)
	id := params["id"]
	projectID, err := uuid.Parse(id)
	if err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid project ID"})
		return
	}

	// delete project and remove bucket atomically
	// phase 1: start transaction
	tx, err := s.projectRepo.GetTx(r.Context())
	if err != nil {
		log.Printf("failed to start db transaction: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to delete project"})
		return
	}
	defer tx.Rollback()

	// get the bucket from db
	bucket, err := s.projectRepo.GetProjectByIDTx(r.Context(), tx, projectID)
	if err != nil {
		if err == repository.ErrProjectNotFound {
			s.sendResponse(w, http.StatusNotFound, models.APIResponse{Message: err.Error()})
			return
		}
		log.Printf("failed to retrieve project for deletion: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to delete project"})
		return
	}

	// phase 2
	//  delete project
	if err := s.projectRepo.DeleteProjectByID(r.Context(), projectID); err != nil {
		log.Printf("failed to delete project: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "failed to delete project"})
		return
	}

	//  delete bucket in store
	if err := s.store.RemoveBucket(r.Context(), bucket.Bucket); err != nil {
		log.Printf("failed to remove bucket from store: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to delete project"})
		return
	}

	// phase 3: commit transaction
	if err := tx.Commit(); err != nil {
		log.Printf("failed to commit transaction. Retrieving deleted bucket now...: %v\n", err)
		// TODO: add removed bucket in the background
		// if err = s.store.CreateBucket(r.Context(), bucket.Bucket, false); err != nil {
		// 	log.Printf("failed to add removed bucket in store: %v\n", err)
		// }
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to delete project"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "Project deleted successfully"})
}

func (s *ProjectHandler) sendResponse(w http.ResponseWriter, status int, resp models.APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}
