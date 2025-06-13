package models

import (
	"time"

	"github.com/google/uuid"
)

// store models

type Bucket struct {
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Object struct {
	Bucket   string `json:"bucket"`
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	Location string `json:"location"`
	// VersionID    string
}

// user models

// User represents a user in our system
type User struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
	// hidden password field during marshaling
	Password  string    `json:"-"`
	FullName  *string   `json:"full_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// project models

// Project represents a project (bucket abstraction) in our system
type Project struct {
	ID        uuid.UUID `json:"id"`
	OwnerID   uuid.UUID `json:"owner_id"`
	Bucket    string    `json:"bucket"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// File represents a file stored in a project
type File struct {
	ID          uuid.UUID `json:"id"`
	Filename    string    `json:"filename"`
	ProjectID   uuid.UUID `json:"project_id"`
	Size        int       `json:"size"`
	ContentType string    `json:"content_type"`
	UploadedBy  uuid.UUID `json:"uploaded_by"`
	CreatedAt   time.Time `json:"created_at"`
}

// APIKey represents an API key for project access
type APIKey struct {
	ID        uuid.UUID  `json:"id"`
	Token     string     `json:"token"`
	Name      string     `json:"name"`
	ProjectID uuid.UUID  `json:"project_id"`
	UserID    uuid.UUID  `json:"user_id"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type APIResponse struct {
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
	// optional errors
	Errors any `json:"errors,omitempty"`
}
