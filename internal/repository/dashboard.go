package repository

import (
	"context"
	"database/sql"
	"sgs/internal/models"

	"github.com/google/uuid"
)

// DashboardRepository handles database operations for files
type DashboardRepository struct {
	db *sql.DB
}

// NewDashboardRepository creates a new file repository
func NewDashboardRepository(db *sql.DB) *DashboardRepository {
	return &DashboardRepository{db: db}
}

// totalProjects: number;
//             totalFiles: number;
//             totalSize: number;
//             activeAPIKeys: number;
//             recentProjects: Project[];
//             storageUsed: string;
//             monthlyGrowth: {
//                 projects: string;
//                 files: string;
//                 storage: string;
//                 apiKeys: string;
//             };

// GetDashboardStatsByOwnerID retrieves a summary stats of all data belonging to a user
func (r *DashboardRepository) GetDashboardStatsByOwnerID(ctx context.Context, ownerId uuid.UUID) (*models.DashboardStats, error) {
	query := `
		SELECT
			(SELECT COUNT(*) FROM projects WHERE owner_id = $1) AS total_projects,

			(SELECT COUNT(*) FROM files WHERE uploaded_by = $1) AS total_files,

			(SELECT SUM(size) FROM files WHERE uploaded_by = $1) AS total_size,

			(SELECT COUNT(*) FROM api_keys WHERE user_id = $1 AND revoked_at IS NULL OR expires_at > NOW() ) AS active_api_keys;
		`
	var stats models.DashboardStats
	err := r.db.QueryRowContext(ctx, query, ownerId).Scan(
		&stats.TotalProjects,
		&stats.TotalFiles,
		&stats.TotalSize,
		&stats.ActiveAPIKeys,
	)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

// TODO: add montly stats
