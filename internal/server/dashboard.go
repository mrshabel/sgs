package server

import (
	"encoding/json"
	"log"
	"net/http"
	"sgs/internal/models"
	"sgs/internal/repository"
	"sgs/internal/utils"
)

// DashboardHandler provides dashboard and analytics
type DashboardHandler struct {
	dashboardRepo *repository.DashboardRepository
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(dashboardRepo *repository.DashboardRepository) *DashboardHandler {
	return &DashboardHandler{
		dashboardRepo: dashboardRepo,
	}
}

// GetDashboardStats creates a new File
func (s *DashboardHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	// get user id
	userID, ok := GetUserID(r)
	if !ok {
		s.sendResponse(w, http.StatusUnauthorized, models.APIResponse{Message: "Unauthorized"})
	}

	//  get user file metadata in db
	stats, err := s.dashboardRepo.GetDashboardStatsByOwnerID(r.Context(), userID)
	if err != nil {
		log.Printf("failed to retrieve dashboard stats: %v\n", err)
		s.sendResponse(w, http.StatusInternalServerError, models.APIResponse{Message: "Failed to retrieve dashboard stats"})
		return
	}

	stats.OwnerID = userID

	// format total size
	stats.StorageUsed = utils.FormatStorageSize(stats.TotalSize)

	s.sendResponse(w, http.StatusOK, models.APIResponse{Message: "Stats retrieved successfully", Data: stats})
}

func (s *DashboardHandler) sendResponse(w http.ResponseWriter, status int, resp models.APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}
