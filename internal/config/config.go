package config

import (
	"fmt"
	"net/url"
	"os"
)

type Config struct {
	Db            string
	DbPassword    string
	DbUsername    string
	DbPort        string
	DbHost        string
	JwtSecret     string
	Port          string
	BaseURL       *url.URL
	StoreAddr     string
	StoreUser     string
	StorePassword string
}

// New returns a config object from the env and a non-nil error if validation errors occurred
func New() (*Config, error) {
	// validate required fields
	if err := validateRequiredVars(); err != nil {
		return nil, err
	}

	// database configs
	db := os.Getenv("DB_DATABASE")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbUsername := os.Getenv("DB_USERNAME")
	dbPort := os.Getenv("DB_PORT")
	dbHost := os.Getenv("DB_HOST")

	// Server configs
	jwtSecret := os.Getenv("JWT_SECRET")
	port := os.Getenv("PORT")

	// Base URL
	baseURLStr := os.Getenv("BASE_URL")
	baseURL, err := url.Parse(baseURLStr)
	if err != nil {
		return nil, fmt.Errorf("invalid base URL: %w", err)
	}

	// storage configs
	storeAddr := os.Getenv("STORE_ADDR")
	storeUser := os.Getenv("STORE_USER")
	storePassword := os.Getenv("STORE_PASSWORD")

	return &Config{
		Db:            db,
		DbPassword:    dbPassword,
		DbUsername:    dbUsername,
		DbPort:        dbPort,
		DbHost:        dbHost,
		JwtSecret:     jwtSecret,
		Port:          port,
		BaseURL:       baseURL,
		StoreAddr:     storeAddr,
		StoreUser:     storeUser,
		StorePassword: storePassword,
	}, nil
}

func validateRequiredVars() error {
	required := []string{"DB_DATABASE", "DB_PASSWORD", "DB_USERNAME", "DB_HOST", "PORT", "BASE_URL", "JWT_SECRET", "STORE_ADDR", "STORE_USER", "STORE_PASSWORD"}

	for _, field := range required {
		if os.Getenv(field) == "" {
			return fmt.Errorf("required environment variable %s is not set", field)
		}
	}
	return nil
}
