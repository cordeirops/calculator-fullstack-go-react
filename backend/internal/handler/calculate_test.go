package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type calculateResponse struct {
	Operation string    `json:"operation"`
	Operands  []float64 `json:"operands"`
	Result    float64   `json:"result"`
}

type errorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func doCalculate(t *testing.T, body string) *httptest.ResponseRecorder {
	t.Helper()

	router := newTestRouter()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)
	return rec
}

func TestCalculate_Success(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		body       string
		wantResult float64
	}{
		{"add", `{"operation":"add","operands":[2,3]}`, 5},
		{"subtract", `{"operation":"subtract","operands":[10,4]}`, 6},
		{"multiply", `{"operation":"multiply","operands":[6,7]}`, 42},
		{"divide", `{"operation":"divide","operands":[10,4]}`, 2.5},
		{"power", `{"operation":"power","operands":[2,10]}`, 1024},
		{"sqrt", `{"operation":"sqrt","operands":[144]}`, 12},
		{"percentage", `{"operation":"percentage","operands":[50,200]}`, 100},
		{"negative operands", `{"operation":"add","operands":[-2,-3]}`, -5},
		{"decimal operands", `{"operation":"add","operands":[1.5,2.25]}`, 3.75},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			rec := doCalculate(t, tt.body)

			require.Equal(t, http.StatusOK, rec.Code)
			var resp calculateResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
			assert.InDelta(t, tt.wantResult, resp.Result, 1e-9)
		})
	}
}

func TestCalculate_BadRequest(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		body     string
		wantCode string
	}{
		{"empty body", ``, "INVALID_JSON"},
		{"malformed JSON", `{"operation":"add",`, "INVALID_JSON"},
		{"operands not an array", `{"operation":"add","operands":"2,3"}`, "INVALID_JSON"},
		{"non-numeric operand (string)", `{"operation":"add","operands":["2",3]}`, "INVALID_OPERAND"},
		{"null operand", `{"operation":"add","operands":[2,null]}`, "INVALID_OPERAND"},
		{"boolean operand", `{"operation":"add","operands":[true,3]}`, "INVALID_OPERAND"},
		{"missing operands field", `{"operation":"add"}`, "INVALID_OPERAND_COUNT"},
		{"too few operands", `{"operation":"add","operands":[2]}`, "INVALID_OPERAND_COUNT"},
		{"too many operands", `{"operation":"add","operands":[2,3,4]}`, "INVALID_OPERAND_COUNT"},
		{"sqrt with two operands", `{"operation":"sqrt","operands":[4,2]}`, "INVALID_OPERAND_COUNT"},
		{"unknown operation", `{"operation":"modulo","operands":[5,2]}`, "UNKNOWN_OPERATION"},
		{"missing operation field", `{"operands":[2,3]}`, "UNKNOWN_OPERATION"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			rec := doCalculate(t, tt.body)

			require.Equal(t, http.StatusBadRequest, rec.Code)
			var resp errorResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
			assert.Equal(t, tt.wantCode, resp.Error.Code)
			assert.NotEmpty(t, resp.Error.Message)
		})
	}
}

func TestCalculate_UnprocessableEntity(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		body     string
		wantCode string
	}{
		{"division by zero", `{"operation":"divide","operands":[10,0]}`, "DIVISION_BY_ZERO"},
		{"sqrt of negative number", `{"operation":"sqrt","operands":[-4]}`, "NEGATIVE_SQRT_OPERAND"},
		{"power overflow", `{"operation":"power","operands":[10,1000]}`, "RESULT_OUT_OF_RANGE"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			rec := doCalculate(t, tt.body)

			require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
			var resp errorResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
			assert.Equal(t, tt.wantCode, resp.Error.Code)
		})
	}
}

func TestCalculate_DivisionByZeroMessage(t *testing.T) {
	t.Parallel()

	rec := doCalculate(t, `{"operation":"divide","operands":[10,0]}`)

	require.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.JSONEq(t, `{"error":{"code":"DIVISION_BY_ZERO","message":"cannot divide by zero"}}`, rec.Body.String())
}
