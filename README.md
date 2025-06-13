# SGS

A free, self-hosted object storage solution

## Features

-   📁 File organization into projects
-   🔑 API key management
-   🔗 Time-limited share public links through pre-signed urls
-   📤 File upload/download
-   📋 File listing and management
-   🔒 Built-in authentication
-   🐳 Docker ready

## Setup

```bash
# clone the repository
git clone https://github.com/mrshabel/sgs.git

# navigate to project directory
cd sgs

# copy example env file
cp .env.example .env

# start services with Docker
docker compose up -d
```

Edit the .env file to configure:

-   Port settings
-   Database credentials
-   Storage credentials
-   JWT secrets

## Development

Requirements:

-   Go 1.21+
-   Docker

```bash
# install dependencies
go mod download

# run tests
make test

# start development server
make watch
```
