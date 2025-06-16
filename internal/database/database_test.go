package database

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"testing"
	"time"

	"sgs/internal/config"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

var testDB *DB
var testConfig *config.Config

func setupTestContainer(t *testing.T) (func(context.Context, ...testcontainers.TerminateOption) error, error) {
	ctx := context.Background()

	// test database configuration
	dbName := "sgs_test"
	dbUser := "test_user"
	dbPass := "test_password"

	container, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:15-alpine"),
		postgres.WithDatabase(dbName),
		postgres.WithUsername(dbUser),
		postgres.WithPassword(dbPass),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(5*time.Second),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to start container: %w", err)
	}

	// get container connection details
	host, err := container.Host(ctx)
	if err != nil {
		return container.Terminate, fmt.Errorf("failed to get container host: %w", err)
	}

	mappedPort, err := container.MappedPort(ctx, "5432")
	if err != nil {
		return container.Terminate, fmt.Errorf("failed to get container port: %w", err)
	}

	// create test config
	baseURL, _ := url.Parse("http://localhost:8080")
	testConfig = &config.Config{
		Db:            dbName,
		DbUsername:    dbUser,
		DbPassword:    dbPass,
		DbPort:        mappedPort.Port(),
		DbHost:        host,
		JwtSecret:     "test_secret",
		Port:          "8080",
		BaseURL:       baseURL,
		StoreAddr:     "localhost:9000",
		StoreUser:     "minioadmin",
		StorePassword: "minioadmin",
	}

	// initialize test database
	testDB, err = New(testConfig)
	if err != nil {
		return container.Terminate, fmt.Errorf("failed to connect to test database: %w", err)
	}

	return container.Terminate, nil
}

func TestMain(m *testing.M) {
	ctx := context.Background()

	teardown, err := setupTestContainer(nil)
	if err != nil {
		log.Fatalf("Could not start test container: %v", err)
	}

	// run tests
	code := m.Run()

	// cleanup
	if err := testDB.Close(); err != nil {
		log.Printf("Failed to close test database: %v", err)
	}

	if teardown != nil {
		if err := teardown(ctx); err != nil {
			log.Printf("Could not teardown container: %v", err)
		}
	}

	os.Exit(code)
}

func TestNew(t *testing.T) {
	if testDB == nil {
		t.Fatal("Test database not initialized")
	}

	// test connection
	if err := testDB.DB.Ping(); err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}
}

// helper function for other tests to get test DB instance
func getTestDB(t *testing.T) *DB {
	t.Helper()

	if testDB == nil {
		t.Fatal("Test database not initialized")
	}
	return testDB
}

// helper function to get test config
func getTestConfig(t *testing.T) *config.Config {
	t.Helper()

	if testConfig == nil {
		t.Fatal("Test config not initialized")
	}
	return testConfig
}
