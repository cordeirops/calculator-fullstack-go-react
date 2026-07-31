package handler_test

import (
	"io"
	"log/slog"
	"net/http"

	"github.com/cordeirops/calculator-fullstack-go-react/backend/internal/handler"
)

const testAllowedOrigin = "http://localhost:5173"

func newTestRouter() http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return handler.NewRouter(logger, testAllowedOrigin)
}
