// Package handler wires the calculator package to HTTP: request/response
// (de)serialization, input validation, error-code mapping, CORS, and
// structured request logging.
package handler

import (
	"log/slog"
	"net/http"
)

// NewRouter builds the full HTTP handler for the API, including CORS and
// logging middleware. allowedOrigin is the value sent back in the
// Access-Control-Allow-Origin header (typically the frontend's dev origin).
func NewRouter(logger *slog.Logger, allowedOrigin string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", handleHealth)
	mux.HandleFunc("POST /api/v1/calculate", handleCalculate)

	return withLogging(logger, withCORS(allowedOrigin, mux))
}
