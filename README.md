# SGS

A free, self-hosted object storage solution

## Features

-   📁 Project-based file organization
-   🔑 API key management
-   🔗 Pre-signed URLs for time-limited sharing
-   📤 File operations (upload/download)
-   🔒 Built-in authentication
-   🐳 Docker ready

## Preview

### Dashboard

![Dashboard Preview](docs/dashboard.png)

### Project Management

![Projects View](docs/projects.png)

### API Keys

![API Keys Management](docs/api-keys.png)

### File Upload

![File Upload Interface](docs/upload.png)

## Setup

```bash
# clone the repository
git clone https://github.com/mrshabel/sgs.git

# navigate to project directory
cd sgs

# copy example env file
cp .env.example .env

# start services with Docker
make docker-run
```

Edit the .env file to configure:

-   Port settings
-   Database credentials
-   Storage credentials
-   JWT secrets

## Development

Requirements:

-   Go 1.23+
-   Docker
-   Node.js 20+

```bash
# install dependencies
go mod download
make watch

# Frontend
cd web
npm install
npm run dev
```

## Testing

```bash
make test
```

## TODO

[] In-App Notifications
[] File Versioning
