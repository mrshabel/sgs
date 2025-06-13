package server

import (
	"context"
	"net/http"
	"sgs/internal/models"
	"strings"

	"github.com/google/uuid"
)

// key type for context values
type contextKey string

const (
	// UserIDKey is the key for user ID in the request context
	UserIDKey contextKey = "userID"
)

// AuthMiddleware checks JWT tokens and adds user info to the request context
func AuthMiddleware(s *AuthHandler) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
				s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Invalid or expired token"})
				return
			}

			// extract user ID from claims
			userIDStr, ok := claims["sub"].(string)
			if !ok {
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
		})
	}
}

// GetUserID retrieves the user ID from the request context
func GetUserID(r *http.Request) (uuid.UUID, bool) {
	userID, ok := r.Context().Value(UserIDKey).(uuid.UUID)
	return userID, ok
}
