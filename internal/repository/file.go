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

// CreateFile adds a new file to the database. An external transaction should be acquired from this repo and passed as a reference to ensure that the full operation is atomic. The caller is responsible for committing or rolling back the transaction
func (r *FileRepository) CreateFile(ctx context.Context, tx *sql.Tx, filename string, objectName string, projectID uuid.UUID, size int64, contentType string, uploadedBy uuid.UUID) (*models.File, error) {
	var file models.File
	query := `
        INSERT INTO files (filename, object_name,  project_id, size, content_type, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, filename, object_name, project_id, size, content_type, uploaded_by, created_at
    `
	// run query in transaction
	if err := tx.QueryRowContext(ctx, query, filename, objectName, projectID, size, contentType, uploadedBy).Scan(
		&file.ID,
		&file.Filename,
		&file.ObjectName,
		&file.ProjectID,
		&file.Size,
		&file.ContentType,
		&file.UploadedBy,
		&file.CreatedAt); err != nil {
		return nil, err
	}
	return &file, nil
}

// GetFileByID retrieves a file by their ID. [ErrFileNotFound] is returned when the file is not found
func (r *FileRepository) GetFileByID(ctx context.Context, id uuid.UUID) (*models.File, error) {
	query := `
		SELECT 
		files.id, 
		files.filename, 
		files.object_name, 
		files.project_id, 
		files.size, 
		files.content_type, 
		files.uploaded_by, 
		files.created_at, 
		projects.bucket
		FROM files
		JOIN projects
		ON files.project_id = projects.id
		WHERE files.id = $1
		`
	var file models.File
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&file.ID,
		&file.Filename,
		&file.ObjectName,
		&file.ProjectID,
		&file.Size,
		&file.ContentType,
		&file.UploadedBy,
		&file.CreatedAt,
		&file.Bucket,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrFileNotFound
		}
		return nil, err
	}
	return &file, nil
}

// GetFileByIDTx retrieves a file by their ID in an external transaction. [ErrFileNotFound] is returned when the file is not found
func (r *FileRepository) GetFileByIDTx(ctx context.Context, tx *sql.Tx, id uuid.UUID) (*models.File, error) {
	query := `
		SELECT 
		files.id, 
		files.filename, 
		files.object_name, 
		files.project_id, 
		files.size, 
		files.content_type, 
		files.uploaded_by, 
		files.created_at, 
		projects.bucket
		FROM files
		JOIN projects
		ON files.project_id = projects.id
		WHERE files.id = $1
		`
	var file models.File
	err := tx.QueryRowContext(ctx, query, id).Scan(
		&file.ID,
		&file.Filename,
		&file.ObjectName,
		&file.ProjectID,
		&file.Size,
		&file.ContentType,
		&file.UploadedBy,
		&file.CreatedAt,
		&file.Bucket,
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
		SELECT id, filename, object_name, project_id, size, content_type, uploaded_by, created_at
		FROM files
		`
	if projectId != nil {
		query += `WHERE project_id = $1`
	}
	// check if filter is enabled
	files := []*models.File{}
	rows, err := r.db.QueryContext(ctx, query, &projectId)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var file models.File
		if err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.ObjectName,
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
		SELECT id, filename, object_name, project_id, size, content_type, uploaded_by, created_at
		FROM files
		WHERE uploaded_by = $1
		`

	// check if filter is enabled
	files := []*models.File{}
	rows, err := r.db.QueryContext(ctx, query, &ownerID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var file models.File
		if err := rows.Scan(
			&file.ID,
			&file.Filename,
			&file.ObjectName,
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

// DeleteFileByID retrieves a file by their ID. An external transaction should be acquired from this repo and passed as a reference to ensure that the full operation is atomic. The caller is responsible for committing or rolling back the transaction. [ErrProjectNotFound] is returned when the query matches no row,
func (r *FileRepository) DeleteFileByID(ctx context.Context, tx *sql.Tx, id uuid.UUID) error {
	query := `
		DELETE FROM files
		WHERE id = $1
		`

	// run statement in transaction
	results, err := tx.ExecContext(ctx, query, id)
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

// GetTx starts a new database transaction to be used in other operations. The isolation level is ReadCommitted. The transaction should be committed on success or rolled backed on error
func (r *FileRepository) GetTx(ctx context.Context) (*sql.Tx, error) {
	return r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
}
