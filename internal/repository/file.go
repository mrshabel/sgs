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
	ErrFileNotFound = errors.New("file not found")
)

// FileRepository handles database operations for files
type FileRepository struct {
	db *sql.DB
}

// NewFileRepository creates a new file repository
func NewFileRepository(db *sql.DB) *FileRepository {
	return &FileRepository{db: db}
}

// CreateFile adds a new file to the database
func (r *FileRepository) CreateFile(ctx context.Context, filename string, project_id uuid.UUID, size int64, contentType string, uploadedBy uuid.UUID, bucket string) (*models.File, error) {
	var file models.File
	query := `
        INSERT INTO files (filename, project_id, size, content_type, uploaded_by)
        VALUES ($1, $2, $3, $4, $5)
		RETURNING id, filename, project_id, size, content_type, uploaded_by, created_at
    `
	if err := r.db.QueryRowContext(ctx, query, filename, project_id, size, contentType, uploadedBy).Scan(
		&file.ID,
		&file.Filename,
		&file.ProjectID,
		&file.Size,
		&file.ContentType,
		&file.UploadedBy,
		&file.CreatedAt); err != nil {
		return nil, err
	}
	return &file, nil
}

// GetFileByID retrieves a file by their ID
func (r *FileRepository) GetFileByID(ctx context.Context, id uuid.UUID) (*models.File, error) {
	query := `
		SELECT id, filename, project_id, size, content_type, uploaded_by, created_at
		FROM files WHERE id = $1
		`
	var file models.File
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&file.ID,
		&file.Filename,
		&file.ProjectID,
		&file.Size,
		&file.ContentType,
		&file.UploadedBy,
		&file.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrFileNotFound
		}
		return nil, err
	}
	return &file, nil
}

// GetFiles retrieves a file by their ID
func (r *FileRepository) GetFiles(ctx context.Context, projectId *uuid.UUID) ([]*models.File, error) {
	query := `
		SELECT id, filename, project_id, size, content_type, uploaded_by, created_at
		FROM files
		`
	if projectId != nil {
		query += `WHERE project_id = $1`
	}
	// check if filter is enabled
	var files []*models.File
	rows, err := r.db.QueryContext(ctx, query, &projectId)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var file models.File
		if err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.ProjectID,
			&file.Size,
			&file.ContentType,
			&file.UploadedBy,
			&file.CreatedAt); err != nil {
			return nil, err
		}
		files = append(files, &file)
	}
	return files, nil
}

// GetFilesByOwnerID retrieves a file by their ID
func (r *FileRepository) GetFilesByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]*models.File, error) {
	query := `
		SELECT id, filename, project_id, size, content_type, uploaded_by, created_at
		FROM files
		WHERE uploaded_by = $1
		`

	// check if filter is enabled
	var files []*models.File
	rows, err := r.db.QueryContext(ctx, query, &ownerID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var file models.File
		if err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.ProjectID,
			&file.Size,
			&file.ContentType,
			&file.UploadedBy,
			&file.CreatedAt); err != nil {
			return nil, err
		}
		files = append(files, &file)
	}
	return files, nil
}

// DeleteFileByID retrieves a file by their ID
func (r *FileRepository) DeleteFileByID(ctx context.Context, id uuid.UUID) error {
	query := `
		DELETE FROM files
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
