package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"sgs/internal/models"
	"sgs/internal/repository"
	"sgs/internal/utils"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	JwtSecret = os.Getenv("JWT_SECRET")
)

// errors
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
	ErrExpiredToken       = errors.New("token has expired")
	ErrUsernameInUse      = errors.New("username already in use")
)

// AuthHandler provides authentication functionality
type AuthHandler struct {
	userRepo *repository.UserRepository
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(userRepo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{
		userRepo: userRepo,
	}
}

// RegisterRequest represents the registration payload
type RegisterRequest struct {
	Username string  `json:"username"`
	Password string  `json:"password"`
	FullName *string `json:"fullName,omitempty"`
}

// validate register request
func (data *RegisterRequest) validate() error {
	if data.Username == "" || data.Password == "" {
		return fmt.Errorf("username and password are required")
	}
	if len(data.Password) < 6 {
		return fmt.Errorf("password should be at least 6 characters")
	}
	return nil
}

// Register creates a new user with the provided credentials
func (s *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	// parse the request body
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Invalid request payload"})
		return
	}
	// Validate input
	if err := req.validate(); err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: err.Error()})
		return
	}

	// check if user already exists
	_, err := s.userRepo.GetUserByUsername(r.Context(), req.Username)
	if err == nil {
		s.sendResponse(w, http.StatusConflict, models.APIResponse{Message: ErrUsernameInUse.Error()})
		return
	}
	if !errors.Is(err, repository.ErrUserNotFound) {
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: err.Error()})
		return
	}

	// hash the password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "failed to register user"})
		return
	}
	// create the user
	user, err := s.userRepo.CreateUser(r.Context(), req.Username, hashedPassword, req.FullName)
	if err != nil {
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: err.Error()})
		return
	}

	s.sendResponse(w, 201, models.APIResponse{Message: "User registered successfully", Data: user})
}

// LoginRequest represents the login payload
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the login response payload
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// validate register request
func (data *LoginRequest) validate() error {
	if data.Username == "" || data.Password == "" {
		return fmt.Errorf("username and password are required")
	}
	if len(data.Password) < 6 {
		return fmt.Errorf("password should be at least 6 characters")
	}
	return nil
}

// Login authenticates a user and returns an access token
func (s *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// parse the request body
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: "Invalid request payload"})
		return
	}
	// Validate input
	if err := req.validate(); err != nil {
		s.sendResponse(w, http.StatusUnprocessableEntity, models.APIResponse{Message: err.Error()})
		return
	}

	user, err := s.userRepo.GetUserByUsername(r.Context(), req.Username)
	if err != nil {
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: ErrInvalidCredentials.Error()})
		return
	}
	// verify the password
	if err := utils.VerifyPassword(user.Password, req.Password); err != nil {
		s.sendResponse(w, http.StatusBadRequest, models.APIResponse{Message: ErrInvalidCredentials.Error()})
		return
	}

	// Generate an access token valid for 1 day
	token, err := s.generateAccessToken(user, 24*time.Hour)
	if err != nil {
		log.Printf("failed to generate access token: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to login"})
		return
	}

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "Login successful", Data: LoginResponse{Token: token, User: *user}})
}

// generateAccessToken creates a new JWT access token
func (s *AuthHandler) generateAccessToken(user *models.User, ttl time.Duration) (string, error) {
	// set expiration time and claims with timestamps in unix format
	expiresAt := time.Now().Add(ttl)
	claims := jwt.MapClaims{
		"sub":      user.ID.String(),
		"username": user.Username,
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	}

	// generate token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// sign token with secret key
	tokenString, err := token.SignedString([]byte(JwtSecret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// ValidateToken verifies a JWT token and returns the claims
func (s *AuthHandler) ValidateToken(tokenString string) (jwt.MapClaims, error) {
	// parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(JwtSecret), nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, err
	}

	// extract and validate claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, ErrInvalidToken
}

func (s *AuthHandler) sendResponse(w http.ResponseWriter, status int, resp models.APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}
