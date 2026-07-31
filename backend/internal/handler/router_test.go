package handler_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRouter_CORSHeaders(t *testing.T) {
	t.Parallel()

	router := newTestRouter()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, testAllowedOrigin, rec.Header().Get("Access-Control-Allow-Origin"))
}

func TestRouter_CORSPreflight(t *testing.T) {
	t.Parallel()

	router := newTestRouter()
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusNoContent, rec.Code)
	assert.Equal(t, testAllowedOrigin, rec.Header().Get("Access-Control-Allow-Origin"))
}

func TestRouter_MethodNotAllowed(t *testing.T) {
	t.Parallel()

	router := newTestRouter()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/calculate", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusMethodNotAllowed, rec.Code)
}

// TestRouter_ConcurrentRequests fires many simultaneous /calculate requests
// against a real HTTP server to demonstrate the handler is safe for
// concurrent use and that each response matches its own request.
func TestRouter_ConcurrentRequests(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(newTestRouter())
	defer server.Close()

	const n = 50
	var wg sync.WaitGroup
	results := make([]calculateResponse, n)
	errs := make([]error, n)

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()

			body := fmt.Sprintf(`{"operation":"add","operands":[%d,1]}`, i)
			resp, err := http.Post(server.URL+"/api/v1/calculate", "application/json", strings.NewReader(body))
			if err != nil {
				errs[i] = err
				return
			}
			defer func() { _ = resp.Body.Close() }()

			var parsed calculateResponse
			if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
				errs[i] = err
				return
			}
			results[i] = parsed
		}(i)
	}

	wg.Wait()

	for i := 0; i < n; i++ {
		require.NoError(t, errs[i])
		assert.InDelta(t, float64(i+1), results[i].Result, 1e-9, "request %d got wrong result, indicates shared state", i)
	}
}
