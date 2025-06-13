package repository

import (
	"context"
	"database/sql"
	"sgs/internal/models"
	"time"

	"github.com/google/uuid"
)

// APIKeyRepository handles database operations for key
type APIKeyRepository struct {
	db *sql.DB
}

// NewAPIKeyRepository creates a new key repository
func NewAPIKeyRepository(db *sql.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

// CreateAPIKey adds a new APIKey to the database
func (r *APIKeyRepository) CreateAPIKey(ctx context.Context, token, name string, projectID, UserID uuid.UUID, expiresAt time.Time) (*models.APIKey, error) {
	var key models.APIKey
	query := `
        INSERT INTO api_keys(token, name, project_id, user_id, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, token, name, project_id, user_id, expires_at, created_at
    `
	var revokedAt sql.NullTime
	if err := r.db.QueryRowContext(ctx, query, token, name, projectID, UserID, expiresAt, revokedAt).Scan(
		&key.ID,
		&key.Token,
		&key.Name,
		&key.ProjectID,
		&key.UserID,
		&key.ExpiresAt,
		revokedAt,
		&key.CreatedAt); err != nil {
		return nil, err
	}
	// check if revoked_at is present
	if revokedAt.Valid {
		key.RevokedAt = &revokedAt.Time
	}

	return &key, nil
}

// GetAPIKeyByToken retrieves an API key by its ID
func (r *APIKeyRepository) GetAPIKeyByToken(ctx context.Context, token string) (*models.APIKey, error) {
	query := `
        SELECT id, token, name, project_id, user_id, expires_at, revoked_at, created_at
        FROM api_keys WHERE token = $1
    `
	var key models.APIKey
	var revokedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, token).Scan(
		&key.ID,
		&key.Token,
		&key.Name,
		&key.ProjectID,
		&key.UserID,
		&key.ExpiresAt,
		&revokedAt,
		&key.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	if revokedAt.Valid {
		key.RevokedAt = &revokedAt.Time
	}

	return &key, nil
}

// GetAPIKeyByID retrieves an API key by its ID
func (r *APIKeyRepository) GetAPIKeyByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	query := `
        SELECT id, token, name, project_id, user_id, expires_at, revoked_at, created_at
        FROM api_keys WHERE id = $1
    `
	var key models.APIKey
	var revokedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&key.ID,
		&key.Token,
		&key.Name,
		&key.ProjectID,
		&key.UserID,
		&key.ExpiresAt,
		&revokedAt,
		&key.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	if revokedAt.Valid {
		key.RevokedAt = &revokedAt.Time
	}

	return &key, nil
}

// GetAPIKeys retrieves all API keys for a project
func (r *APIKeyRepository) GetAPIKeysByProjectID(ctx context.Context, projectID uuid.UUID) ([]*models.APIKey, error) {
	query := `
        SELECT id, token, name, project_id, user_id, expires_at, revoked_at, created_at
        FROM api_keys
		WHERE project_id = $1
    `

	rows, err := r.db.QueryContext(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []*models.APIKey
	for rows.Next() {
		var key models.APIKey
		var revokedAt sql.NullTime

		if err := rows.Scan(
			&key.ID,
			&key.Token,
			&key.Name,
			&key.ProjectID,
			&key.UserID,
			&key.ExpiresAt,
			&revokedAt,
			&key.CreatedAt,
		); err != nil {
			return nil, err
		}

		if revokedAt.Valid {
			key.RevokedAt = &revokedAt.Time
		}

		keys = append(keys, &key)
	}

	return keys, nil
}

// GetAPIKeysByUserID retrieves all API keys for a user
func (r *APIKeyRepository) GetAPIKeysByUserID(ctx context.Context, userID uuid.UUID) ([]*models.APIKey, error) {
	query := `
        SELECT id, token, name, project_id, user_id, expires_at, revoked_at, created_at
        FROM api_keys
        WHERE user_id = $1
    `
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []*models.APIKey
	for rows.Next() {
		var key models.APIKey
		var revokedAt sql.NullTime

		if err := rows.Scan(
			&key.ID,
			&key.Token,
			&key.Name,
			&key.ProjectID,
			&key.UserID,
			&key.ExpiresAt,
			&revokedAt,
			&key.CreatedAt,
		); err != nil {
			return nil, err
		}

		if revokedAt.Valid {
			key.RevokedAt = &revokedAt.Time
		}

		keys = append(keys, &key)
	}

	return keys, nil
}

// RevokeAPIKey revokes an API key by setting its revoked_at timestamp
func (r *APIKeyRepository) RevokeAPIKey(ctx context.Context, id uuid.UUID) error {
	query := `
        UPDATE api_keys
        SET revoked_at = NOW()
        WHERE id = $1 AND revoked_at IS NULL
    `
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// DeleteAPIKey permanently deletes an API key
func (r *APIKeyRepository) DeleteAPIKey(ctx context.Context, id uuid.UUID) error {
	query := `
        DELETE FROM api_keys
        WHERE id = $1
    `
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}
