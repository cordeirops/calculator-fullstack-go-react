package calculator_test

import (
	"errors"
	"math"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/cordeirops/calculator-fullstack-go-react/backend/internal/calculator"
)

func TestCalculate_Success(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		op       calculator.Operation
		operands []float64
		want     float64
	}{
		{"add positive numbers", calculator.Add, []float64{2, 3}, 5},
		{"add negative numbers", calculator.Add, []float64{-2, -3}, -5},
		{"subtract", calculator.Subtract, []float64{10, 4}, 6},
		{"subtract to negative", calculator.Subtract, []float64{4, 10}, -6},
		{"multiply", calculator.Multiply, []float64{6, 7}, 42},
		{"multiply by zero", calculator.Multiply, []float64{6, 0}, 0},
		{"divide", calculator.Divide, []float64{10, 4}, 2.5},
		{"divide negative", calculator.Divide, []float64{-10, 4}, -2.5},
		{"power", calculator.Power, []float64{2, 10}, 1024},
		{"power zero exponent", calculator.Power, []float64{5, 0}, 1},
		{"power fractional exponent", calculator.Power, []float64{4, 0.5}, 2},
		{"sqrt perfect square", calculator.Sqrt, []float64{144}, 12},
		{"sqrt zero", calculator.Sqrt, []float64{0}, 0},
		{"sqrt non-perfect square", calculator.Sqrt, []float64{2}, math.Sqrt2},
		{"percentage: 50% of 200", calculator.Percentage, []float64{50, 200}, 100},
		{"percentage: 0% of 200", calculator.Percentage, []float64{0, 200}, 0},
		{"percentage: 100% of 50", calculator.Percentage, []float64{100, 50}, 50},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got, err := calculator.Calculate(tt.op, tt.operands)

			require.NoError(t, err)
			assert.InDelta(t, tt.want, got, 1e-9)
		})
	}
}

func TestCalculate_FloatingPointPrecision(t *testing.T) {
	t.Parallel()

	got, err := calculator.Calculate(calculator.Add, []float64{0.1, 0.2})

	require.NoError(t, err)
	// 0.1 + 0.2 != 0.3 exactly in IEEE-754 float64; assert within a small
	// epsilon rather than exact equality.
	assert.InDelta(t, 0.3, got, 1e-9)
	assert.NotEqual(t, 0.3, got, "expected the classic float64 rounding artifact")
}

func TestCalculate_DomainErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		op       calculator.Operation
		operands []float64
		wantErr  error
	}{
		{"divide by zero", calculator.Divide, []float64{10, 0}, calculator.ErrDivisionByZero},
		{"divide zero by zero", calculator.Divide, []float64{0, 0}, calculator.ErrDivisionByZero},
		{"sqrt of negative number", calculator.Sqrt, []float64{-4}, calculator.ErrNegativeSqrtOperand},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			_, err := calculator.Calculate(tt.op, tt.operands)

			require.Error(t, err)
			assert.ErrorIs(t, err, tt.wantErr)
		})
	}
}

func TestCalculate_InvalidOperandCount(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		op       calculator.Operation
		operands []float64
	}{
		{"add with one operand", calculator.Add, []float64{1}},
		{"add with three operands", calculator.Add, []float64{1, 2, 3}},
		{"add with no operands", calculator.Add, []float64{}},
		{"sqrt with two operands", calculator.Sqrt, []float64{4, 2}},
		{"sqrt with no operands", calculator.Sqrt, []float64{}},
		{"percentage with one operand", calculator.Percentage, []float64{50}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			_, err := calculator.Calculate(tt.op, tt.operands)

			require.Error(t, err)
			assert.ErrorIs(t, err, calculator.ErrInvalidOperandCount)
		})
	}
}

func TestCalculate_UnknownOperation(t *testing.T) {
	t.Parallel()

	_, err := calculator.Calculate(calculator.Operation("modulo"), []float64{5, 2})

	require.Error(t, err)
	assert.ErrorIs(t, err, calculator.ErrUnknownOperation)
}

func TestCalculate_Overflow(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		op       calculator.Operation
		operands []float64
	}{
		{"power overflows to +Inf", calculator.Power, []float64{10, 1000}},
		{"multiply overflows to +Inf", calculator.Multiply, []float64{math.MaxFloat64, 2}},
		{"power of negative base with fractional exponent yields NaN", calculator.Power, []float64{-8, 0.5}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			_, err := calculator.Calculate(tt.op, tt.operands)

			require.Error(t, err)
			assert.ErrorIs(t, err, calculator.ErrResultOutOfRange)
		})
	}
}

// TestCalculate_ConcurrentUse exercises Calculate from many goroutines at
// once. The dispatch table is only ever read, never mutated, so this must
// be race-free (run with -race in CI).
func TestCalculate_ConcurrentUse(t *testing.T) {
	t.Parallel()

	const goroutines = 100
	var wg sync.WaitGroup
	errs := make(chan error, goroutines)

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			result, err := calculator.Calculate(calculator.Add, []float64{float64(n), 1})
			if err != nil {
				errs <- err
				return
			}
			if result != float64(n)+1 {
				errs <- errors.New("unexpected result from concurrent Calculate call")
			}
		}(i)
	}

	wg.Wait()
	close(errs)

	for err := range errs {
		assert.NoError(t, err)
	}
}
