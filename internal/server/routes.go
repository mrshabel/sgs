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
	authHandler := NewAuthHandler(userRepo)

	// Register routes
	r = r.PathPrefix("/api").Subrouter()
	r.HandleFunc("/health", s.healthHandler).Methods(http.MethodGet)
	r.HandleFunc("/ping", s.PingHandler).Methods(http.MethodGet)

	// auth routes
	r.HandleFunc("/auth/register", authHandler.Register).Methods(http.MethodPost)
	r.HandleFunc("/auth/login", authHandler.Login).Methods(http.MethodPost)

	// protected routes
	protected := r.NewRoute().Subrouter()
	protected.Use(AuthMiddleware(authHandler))

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
