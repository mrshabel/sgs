package repository

import (
	"context"
	"database/sql"
	"errors"
	"sgs/internal/models"

	"github.com/google/uuid"
)

// errors
var (
	ErrUserNotFound = errors.New("user not found")
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser adds a new user to the database
func (r *UserRepository) CreateUser(ctx context.Context, username, password string, fullName *string) (*models.User, error) {
	var user models.User
	query := `
        INSERT INTO users (username, password, full_name)
        VALUES ($1, $2, $3)
		RETURNING id, username, full_name, created_at, updated_at
    `
	if err := r.db.QueryRowContext(ctx, query, username, password, &fullName).Scan(&user.ID, &user.Username, &user.FullName, &user.CreatedAt, &user.UpdatedAt); err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByUsername retrieves a user by their email address
func (r *UserRepository) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT id, username, full_name, password, created_at, updated_at 
		FROM users 
		WHERE username = $1
		`
	var user models.User
	err := r.db.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.FullName,
		&user.Password,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// GetUserByID retrieves a user by their ID
func (r *UserRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
	SELECT id, username, full_name, password, created_at, updated_at FROM users WHERE id = $1
	`
	var user models.User
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.FullName,
		&user.Password,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}
