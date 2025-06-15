package server

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"sgs/internal/models"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// key type for context values
type contextKey string

const (
	// UserIDKey is the key for user ID in the request context
	UserIDKey contextKey = "userID"
	// APIKey is the token for the API key in the request context
	APIKeyToken contextKey = "APIKey"
)

// AuthMiddleware checks JWT tokens and adds user info to the request context
func AuthMiddleware(s *AuthHandler) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// first check if api key is present
			if r.Header.Get("X-API-Key") != "" {
				// extract api key
				token := r.Header.Get("X-API-Key")
				if token == "" {
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "API key required"})
					return
				}

				// ensure api key is only scoped to project specific paths
				if !strings.Contains(r.URL.Path, "projects") {
					s.sendResponse(w, http.StatusForbidden, models.APIResponse{Message: "Forbidden request"})
					return
				}

				// validate api key
				key, err := s.apiKeyRepo.GetAPIKeyByToken(r.Context(), token)
				if err != nil {
					if err == sql.ErrNoRows {
						s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Invalid API key"})
						return
					}
					log.Printf("Failed to retrieve API key %v\n", err)
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Failed to validate API key"})
					return
				}

				// validate ownership
				projectID, err := uuid.Parse(mux.Vars(r)["id"])
				if err != nil {
					s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: "Invalid project ID"})
					return
				}

				if projectID != key.ProjectID {
					log.Println(projectID, key.ProjectID, key.ProjectBucket)
					s.sendResponse(w, http.StatusForbidden, models.APIResponse{Message: "You don't have access to this project"})
					return
				}

				// validate key expiry
				now := time.Now().UTC()
				if key.ExpiresAt.UTC().Before(now) || key.RevokedAt != nil {
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "API key has been revoked or has expired"})
					return
				}

				// add owner info and key token into request
				ctx := context.WithValue(r.Context(), UserIDKey, key.UserID)
				ctx = context.WithValue(ctx, APIKeyToken, token)

				// call the next handler with the context
				next.ServeHTTP(w, r.WithContext(ctx))
			} else {
				// extract token from Authorization header
				authHeader := r.Header.Get("Authorization")
				if authHeader == "" {
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Authorization header required"})
					return
				}

				// check Bearer token format
				parts := strings.Split(authHeader, " ")
				if len(parts) != 2 || parts[0] != "Bearer" {
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Invalid authorization format"})
					return
				}

				tokenString := parts[1]

				// validate the token
				claims, err := s.ValidateToken(tokenString)
				if err != nil {
					log.Printf("Invalid jwt token: %v\n", err)
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Invalid or expired token"})
					return
				}

				// extract user ID from claims
				userIDStr, ok := claims["sub"].(string)
				if !ok {
					log.Printf("Invalid jwt token claims. Token is malformed: %v\n", claims)
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Invalid token claims"})
					return
				}

				userID, err := uuid.Parse(userIDStr)
				if err != nil {
					s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Invalid user ID in token"})
					return
				}

				// add user ID to request context
				ctx := context.WithValue(r.Context(), UserIDKey, userID)

				// call the next handler with the context
				next.ServeHTTP(w, r.WithContext(ctx))
			}
		})
	}

}

// GetUserID retrieves the user ID from the request context
func GetUserID(r *http.Request) (uuid.UUID, bool) {
	userID, ok := r.Context().Value(UserIDKey).(uuid.UUID)
	return userID, ok
}

// GetAPIKeyToken retrieves the api key token from the request context
func GetAPIKeyToken(r *http.Request) (string, bool) {
	token, ok := r.Context().Value(APIKeyToken).(string)
	return token, ok
}
