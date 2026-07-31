package calculator

import "math"

func add(a, b float64) (float64, error) {
	return a + b, nil
}

func subtract(a, b float64) (float64, error) {
	return a - b, nil
}

func multiply(a, b float64) (float64, error) {
	return a * b, nil
}

func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return a / b, nil
}

// power is O(1): it delegates to the stdlib's math.Pow rather than computing
// the result via repeated multiplication.
func power(a, b float64) (float64, error) {
	return math.Pow(a, b), nil
}

// sqrt is O(1): it delegates to the stdlib's math.Sqrt rather than an
// iterative approximation (e.g. Newton's method).
func sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrtOperand
	}
	return math.Sqrt(a), nil
}

// percentage computes "a percent of b": (a / 100) * b.
func percentage(a, b float64) (float64, error) {
	return (a / 100) * b, nil
}
