package server

import (
	"encoding/json"
	"log"
	"net/http"
	"sgs/internal/repository"

	"github.com/gorilla/mux"
)

func (s *Server) RegisterRoutes() http.Handler {
	// setup router
	r := mux.NewRouter()

	// setup repos and handlers
	userRepo := repository.NewUserRepository(s.db.DB)
	projectRepo := repository.NewProjectRepository(s.db.DB)
	fileRepo := repository.NewFileRepository(s.db.DB)
	dashboardRepo := repository.NewDashboardRepository(s.db.DB)
	apiKeyRepo := repository.NewAPIKeyRepository(s.db.DB)

	authHandler := NewAuthHandler(s.cfg, userRepo, apiKeyRepo)
	projectHandler := NewProjectHandler(projectRepo, s.store)
	fileHandler := NewFileHandler(s.cfg, fileRepo, projectRepo, s.store)
	dashboardHandler := NewDashboardHandler(dashboardRepo)
	apiKeyHandler := NewAPIKeyHandler(apiKeyRepo)

	// api router
	r = r.PathPrefix("/api").Subrouter()

	// public routes
	public := r.NewRoute().Subrouter()

	// protected routes
	protected := r.NewRoute().Subrouter()
	protected.Use(AuthMiddleware(authHandler))

	// Register routes
	r.HandleFunc("/health", s.healthHandler).Methods(http.MethodGet)
	r.HandleFunc("/ping", s.PingHandler).Methods(http.MethodGet)

	// auth routes
	r.HandleFunc("/auth/register", authHandler.Register).Methods(http.MethodPost)
	r.HandleFunc("/auth/login", authHandler.Login).Methods(http.MethodPost)

	// project routes
	protected.HandleFunc("/projects", projectHandler.CreateProject).Methods(http.MethodPost)
	protected.HandleFunc("/projects", projectHandler.GetUserProjects).Methods(http.MethodGet)
	protected.HandleFunc("/projects/{id}", projectHandler.GetProject).Methods(http.MethodGet)
	protected.HandleFunc("/projects/{id}", projectHandler.DeleteProject).Methods(http.MethodDelete)
	// nested file routes for projects
	protected.HandleFunc("/projects/{id}/files", fileHandler.UploadFile).Methods(http.MethodPost)
	protected.HandleFunc("/projects/{id}/files/meta", fileHandler.GetProjectFilesMeta).Methods(http.MethodGet)
	// nested routes for api keys
	protected.HandleFunc("/projects/{id}/api-keys", apiKeyHandler.CreateAPIKey).Methods(http.MethodPost)
	protected.HandleFunc("/projects/{id}/api-keys", apiKeyHandler.GetProjectAPIKeys).Methods(http.MethodGet)

	// files
	protected.HandleFunc("/files/me", fileHandler.GetUserFilesMeta).Methods(http.MethodGet)
	// public signed url route
	public.HandleFunc("/files/download-signed", fileHandler.DownloadSignedFileHandler).Methods(http.MethodGet)
	protected.HandleFunc("/files/{id}", fileHandler.GetFileMeta).Methods(http.MethodGet)
	protected.HandleFunc("/files/{id}", fileHandler.DeleteFile).Methods(http.MethodDelete)
	protected.HandleFunc("/files/{id}/download", fileHandler.DownloadFileHandler).Methods(http.MethodGet)
	protected.HandleFunc("/files/{id}/share", fileHandler.GenerateSignedURLHandler).Methods(http.MethodPost)

	// dashboard stats
	protected.HandleFunc("/dashboard/stats", dashboardHandler.GetDashboardStats).Methods(http.MethodGet)

	// api key routes
	protected.HandleFunc("/api-keys/me", apiKeyHandler.GetUserAPIKeys).Methods(http.MethodGet)
	protected.HandleFunc("/api-keys/{id}", apiKeyHandler.GetAPIKey).Methods(http.MethodGet)
	protected.HandleFunc("/api-keys/{id}", apiKeyHandler.DeleteAPIKey).Methods(http.MethodDelete)
	protected.HandleFunc("/api-keys/{id}/revoke", apiKeyHandler.RevokeAPIKey).Methods(http.MethodPatch)

	// Wrap the router with CORS middleware
	return s.corsMiddleware(r)
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-API-KEY, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "false")

		// Handle preflight OPTIONS requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Proceed with the next handler
		next.ServeHTTP(w, r)
	})
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := json.Marshal(s.db.Health())
	if err != nil {
		http.Error(w, "Failed to marshal health check response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(resp); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}

// test handler
func (s *Server) PingHandler(w http.ResponseWriter, r *http.Request) {
	resp := map[string]string{"message": "pong"}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		http.Error(w, "Failed to marshal response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(jsonResp); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}
