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
	ErrProjectNotFound = errors.New("project not found")
)

// ProjectRepository handles database operations for projects
type ProjectRepository struct {
	db *sql.DB
}

// NewProjectRepository creates a new project repository
func NewProjectRepository(db *sql.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

// CreateProject adds a new project to the database
func (r *ProjectRepository) CreateProject(ctx context.Context, owner_id uuid.UUID, bucket string) (*models.Project, error) {
	var project models.Project
	query := `
        INSERT INTO projects (owner_id, bucket)
        VALUES ($1, $2)
		RETURNING id, owner_id, bucket, created_at, updated_at
    `
	if err := r.db.QueryRowContext(ctx, query, owner_id, bucket).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Bucket,
		&project.CreatedAt,
		&project.UpdatedAt); err != nil {
		return nil, err
	}
	return &project, nil
}

// GetProjectByProjectByBucket retrieves a project by their email address
func (r *ProjectRepository) GetProjectByProjectByBucket(ctx context.Context, bucket string) (*models.Project, error) {
	query := `
		SELECT id, owner_id, bucket, created_at, updated_at
		FROM projects WHERE bucket = $1
		`
	var project models.Project
	err := r.db.QueryRowContext(ctx, query, bucket).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Bucket,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &project, nil
}

// GetProjectByID retrieves a project by their ID
func (r *ProjectRepository) GetProjectByID(ctx context.Context, id uuid.UUID) (*models.Project, error) {
	query := `
		SELECT id, owner_id, bucket, created_at, updated_at
		FROM projects WHERE id = $1
		`
	var project models.Project
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Bucket,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &project, nil
}

// DeleteProjectByID retrieves a project by their ID
func (r *ProjectRepository) DeleteProjectByID(ctx context.Context, id uuid.UUID) error {
	query := `
		DELETE FROM projects
		WHERE id = $1
		`
	results, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	affected, err := results.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrProjectNotFound
	}
	return nil
}
