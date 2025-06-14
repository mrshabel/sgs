package repository

import (
	"context"
	"database/sql"
	"errors"
	"sgs/internal/models"
	"sgs/internal/utils"

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

// CreateProject adds a new project to the database. An external transaction should be acquired from this repo and passed as a reference to ensure that the full operation is atomic. The caller is responsible for committing or rolling back the transaction
func (r *ProjectRepository) CreateProject(ctx context.Context, tx *sql.Tx, owner_id uuid.UUID, bucket string) (*models.Project, error) {
	var project models.Project
	query := `
        INSERT INTO projects (owner_id, bucket)
        VALUES ($1, $2)
		RETURNING id, owner_id, bucket, created_at, updated_at
    `

	// run query in transaction
	if err := tx.QueryRowContext(ctx, query, owner_id, bucket).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Bucket,
		&project.CreatedAt,
		&project.UpdatedAt); err != nil {
		return nil, err
	}
	return &project, nil
}

// GetProjectByBucket retrieves a project by their email address. [ErrProjectNotFound] is returned when the associated project does not exist
func (r *ProjectRepository) GetProjectByBucket(ctx context.Context, bucket string) (*models.Project, error) {
	query := `
		SELECT id, owner_id, bucket, created_at, updated_at
		FROM projects WHERE bucket = $1
		ORDER BY updated_at DESC
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
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return &project, nil
}

// GetProjectByID retrieves a project by their ID. [ErrProjectNotFound] is returned when the associated project does not exist
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
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return &project, nil
}

// GetProjectByID retrieves a project by their ID. [ErrProjectNotFound] is returned when the associated project does not exist. An external transaction should be acquired from this repo and passed as a reference to ensure that the full operation is atomic.
func (r *ProjectRepository) GetProjectByIDTx(ctx context.Context, tx *sql.Tx, id uuid.UUID) (*models.Project, error) {
	query := `
		SELECT id, owner_id, bucket, created_at, updated_at
		FROM projects WHERE id = $1
		`
	var project models.Project
	err := tx.QueryRowContext(ctx, query, id).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Bucket,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return &project, nil
}

// GetProjectsByOwnerID retrieves all projects by their OwnerID. [ErrProjectNotFound] is returned when the associated project does not exist. The total files in the project is returned as part of the output data
func (r *ProjectRepository) GetProjectsByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]*models.Project, error) {
	query := `
		WITH cte AS (
            SELECT project_id, COUNT(*) AS file_count, SUM(size) AS total_size
            FROM files
            WHERE uploaded_by = $1
            GROUP BY project_id
        )
        SELECT
            p.id,
            p.owner_id,
            p.bucket,
            p.created_at,
            p.updated_at,
            COALESCE(fc.file_count, 0) AS file_count,
            COALESCE(fc.total_size, 0) AS total_size
        FROM projects p
        LEFT JOIN cte fc ON fc.project_id = p.id
        WHERE p.owner_id = $1
        ORDER BY p.updated_at DESC
		`
	rows, err := r.db.QueryContext(ctx, query, ownerID)
	if err != nil {
		return nil, err
	}
	projects := []*models.Project{}
	for rows.Next() {
		var project models.Project
		// convert parse total size
		var totalSize int64
		if err := rows.Scan(
			&project.ID,
			&project.OwnerID,
			&project.Bucket,
			&project.CreatedAt,
			&project.UpdatedAt,
			&project.FileCount,
			&totalSize,
		); err != nil {
			return nil, err
		}
		project.TotalFileSize = utils.FormatStorageSize(totalSize)
		projects = append(projects, &project)
	}
	return projects, nil
}

// DeleteProjectByID deletes a project by their ID. [ErrProjectNotFound] is returned when the associated project does not exist
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

// GetTx starts a new database transaction to be used in other operations. The isolation level is ReadCommitted. The transaction should be committed on success or rolled backed on error
func (r *ProjectRepository) GetTx(ctx context.Context) (*sql.Tx, error) {
	return r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
}
