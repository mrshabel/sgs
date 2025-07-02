package server

import (
	"fmt"
	"net/http"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"sgs/internal/config"
	"sgs/internal/database"
	"sgs/internal/store"
)

type Server struct {
	cfg   *config.Config
	db    *database.DB
	store *store.Store
}

func NewServer() (*http.Server, error) {
	// get config
	cfg, err := config.New()
	if err != nil {
		return nil, err
	}

	// connect to store
	store, err := store.New(cfg)
	if err != nil {
		return nil, err
	}
	// connect to db
	db, err := database.New(cfg)
	if err != nil {
		return nil, err
	}

	NewServer := &Server{
		cfg:   cfg,
		db:    db,
		store: store,
	}

	// Declare Server config
	server := &http.Server{
		Addr:        fmt.Sprintf(":%s", cfg.Port),
		Handler:     NewServer.RegisterRoutes(),
		IdleTimeout: time.Minute,
		// ReadTimeout:  10 * time.Second,
		// WriteTimeout: 30 * time.Second,
	}

	return server, nil
}
