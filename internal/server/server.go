package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"sgs/internal/database"
	"sgs/internal/store"
)

type Server struct {
	port int

	db    *database.DB
	store *store.Store
}

func NewServer() (*http.Server, error) {
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	// connect to store
	store, err := store.New()
	if err != nil {
		return nil, err
	}

	NewServer := &Server{
		port: port,

		db:    database.New(),
		store: store,
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server, nil
}
