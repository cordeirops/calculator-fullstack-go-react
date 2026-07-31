package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/cordeirops/calculator-fullstack-go-react/backend/internal/calculator"
)

type calculateRequest struct {
	Operation string        `json:"operation"`
	Operands  []interface{} `json:"operands"`
}

type calculateResponse struct {
	Operation string    `json:"operation"`
	Operands  []float64 `json:"operands"`
	Result    float64   `json:"result"`
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	var req calculateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", "request body must be a valid JSON object")
		return
	}

	operands, err := parseOperands(req.Operands)
	if err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_OPERAND", err.Error())
		return
	}

	result, err := calculator.Calculate(calculator.Operation(req.Operation), operands)
	if err != nil {
		status, code := mapCalculatorError(err)
		respondError(w, status, code, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, calculateResponse{
		Operation: req.Operation,
		Operands:  operands,
		Result:    result,
	})
}

// parseOperands converts the loosely-typed JSON operands into float64,
// rejecting non-numeric values (strings, booleans, objects, arrays, and
// JSON null) explicitly rather than silently coercing them.
func parseOperands(raw []interface{}) ([]float64, error) {
	operands := make([]float64, len(raw))
	for i, v := range raw {
		num, ok := v.(float64)
		if !ok {
			return nil, fmt.Errorf("operand at index %d must be a number", i)
		}
		operands[i] = num
	}
	return operands, nil
}

func mapCalculatorError(err error) (status int, code string) {
	switch {
	case errors.Is(err, calculator.ErrDivisionByZero):
		return http.StatusUnprocessableEntity, "DIVISION_BY_ZERO"
	case errors.Is(err, calculator.ErrNegativeSqrtOperand):
		return http.StatusUnprocessableEntity, "NEGATIVE_SQRT_OPERAND"
	case errors.Is(err, calculator.ErrResultOutOfRange):
		return http.StatusUnprocessableEntity, "RESULT_OUT_OF_RANGE"
	case errors.Is(err, calculator.ErrUnknownOperation):
		return http.StatusBadRequest, "UNKNOWN_OPERATION"
	case errors.Is(err, calculator.ErrInvalidOperandCount):
		return http.StatusBadRequest, "INVALID_OPERAND_COUNT"
	default:
		return http.StatusInternalServerError, "INTERNAL_ERROR"
	}
}
