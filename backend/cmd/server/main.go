// Command server starts the calculator REST API.
package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/cordeirops/calculator-fullstack-go-react/backend/internal/handler"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	port := getEnv("PORT", "8080")
	allowedOrigin := getEnv("CORS_ALLOWED_ORIGIN", "http://localhost:5173")

	router := handler.NewRouter(logger, allowedOrigin)

	addr := ":" + port
	logger.Info("starting server", "addr", addr, "cors_allowed_origin", allowedOrigin)

	if err := http.ListenAndServe(addr, router); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
