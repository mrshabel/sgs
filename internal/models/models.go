package models

import (
	"time"

	"github.com/google/uuid"
)

// store models

type Bucket struct {
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
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
	FullName  *string   `json:"fullName"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// project models

// Project represents a project (bucket abstraction) in our system
type Project struct {
	ID        uuid.UUID `json:"id"`
	OwnerID   uuid.UUID `json:"ownerId"`
	Bucket    string    `json:"bucket"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// File represents a file stored in a project
type File struct {
	ID uuid.UUID `json:"id"`
	// original filename
	Filename string `json:"filename"`
	// path to bucket. <project_name-filename>
	ObjectName  string    `json:"objectName"`
	ProjectID   uuid.UUID `json:"projectId"`
	Size        int64     `json:"size"`
	ContentType string    `json:"contentType"`
	UploadedBy  uuid.UUID `json:"uploadedBy"`
	CreatedAt   time.Time `json:"createdAt"`

	// denormalized bucket name
	Bucket *string `json:"bucket,omitempty"`
}

// APIKey represents an API key for project access
type APIKey struct {
	ID        uuid.UUID  `json:"id"`
	Token     string     `json:"token"`
	Name      string     `json:"name"`
	ProjectID uuid.UUID  `json:"projectId"`
	UserID    uuid.UUID  `json:"userId"`
	ExpiresAt time.Time  `json:"expiresAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

type APIResponse struct {
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
	// optional errors
	Errors any `json:"errors,omitempty"`
}
