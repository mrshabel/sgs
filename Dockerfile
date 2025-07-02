FROM golang:1.23-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main cmd/api/main.go

FROM alpine:3.20.1 AS api
WORKDIR /app
# COPY binary and migration file
# TODO: run migration separately
COPY --from=build /app/db /app/db
COPY --from=build /app/main /app/main
EXPOSE ${PORT}
CMD ["./main"]


# setup web
FROM node:20 AS web_builder
WORKDIR /web

COPY web/package*.json ./
RUN npm install
COPY web/. .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM node:23-slim AS web
RUN npm install -g serve
COPY --from=web_builder /web/dist /app/dist
EXPOSE 5173
CMD ["serve", "-s", "/app/dist", "-l", "5173"]
