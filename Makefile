help:
	@echo "Available commands:"
	@echo "  make build         - Build the application"
	@echo "  make run          - Run the API and web application"
	@echo "  make test         - Run unit tests"
	@echo "  make itest        - Run integration tests"
	@echo "  make watch        - Start live reload development for API server"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-build - Build and start Docker services"
	@echo "  make docker-run   - Start Docker services"
	@echo "  make docker-stop  - Stop Docker services"
	@echo "  make docker-logs  - View Docker services logs"
	@echo "  make docker-down  - Stop and remove Docker services"

# build the application
all: build test

build:
	@echo "Building..."
	
	
	@go build -o main.exe cmd/api/main.go

# run the application
run:
	@go run cmd/api/main.go &
	@npm install --prefer-offline --no-fund --prefix ./web
	@npm run dev --prefix ./web
	
# create services
docker-build:
	@docker compose up --build

# view logs
docker-logs:
	@docker compose logs

# run services
docker-run:
	@docker compose up

# shutdown and remove services
docker-down:
	@docker compose down

# stop services
docker-stop:
	@docker compose stop

# Test the application
test:
	@echo "Testing..."
	@go test ./... -v
# Integrations Tests for the application
itest:
	@echo "Running integration tests..."
	@go test ./internal/database -v

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Live Reload
watch:
# install air if not present
	@docker compose -f docker-compose.dev.yaml up -d
	@powershell -ExecutionPolicy Bypass -Command "if (Get-Command air -ErrorAction SilentlyContinue) { \
		air; \
		Write-Output 'Watching...'; \
	} else { \
		Write-Output 'Installing air...'; \
		go install github.com/air-verse/air@latest; \
		air; \
		Write-Output 'Watching...'; \
	}"

.PHONY: all build run test clean watch docker-run docker-down itest help
