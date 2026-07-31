// Package calculator implements the pure arithmetic logic of the
// calculator, independent of any transport (HTTP, CLI, etc).
package calculator

import (
	"fmt"
	"math"
)

// Operation identifies an arithmetic operation supported by Calculate.
type Operation string

const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	Sqrt       Operation = "sqrt"
	Percentage Operation = "percentage"
)

type calcFunc func(operands []float64) (float64, error)

// operations is a dispatch table mapping each supported Operation to its
// implementation. Adding a new operation only requires adding one entry
// here plus its pure function in operations.go.
var operations = map[Operation]calcFunc{
	Add:        binary(Add, add),
	Subtract:   binary(Subtract, subtract),
	Multiply:   binary(Multiply, multiply),
	Divide:     binary(Divide, divide),
	Power:      binary(Power, power),
	Sqrt:       unary(Sqrt, sqrt),
	Percentage: binary(Percentage, percentage),
}

// binary wraps a two-operand function with arity validation.
func binary(op Operation, fn func(a, b float64) (float64, error)) calcFunc {
	return func(operands []float64) (float64, error) {
		if len(operands) != 2 {
			return 0, fmt.Errorf("%w: operation %q requires 2 operands, got %d", ErrInvalidOperandCount, op, len(operands))
		}
		return fn(operands[0], operands[1])
	}
}

// unary wraps a one-operand function with arity validation.
func unary(op Operation, fn func(a float64) (float64, error)) calcFunc {
	return func(operands []float64) (float64, error) {
		if len(operands) != 1 {
			return 0, fmt.Errorf("%w: operation %q requires 1 operand, got %d", ErrInvalidOperandCount, op, len(operands))
		}
		return fn(operands[0])
	}
}

// Calculate executes op over operands and returns the result.
//
// It returns ErrUnknownOperation for an unrecognized op, ErrInvalidOperandCount
// when the number of operands doesn't match what op requires, and
// ErrDivisionByZero, ErrNegativeSqrtOperand, or ErrResultOutOfRange for
// semantic errors specific to the operation or its result.
func Calculate(op Operation, operands []float64) (float64, error) {
	fn, ok := operations[op]
	if !ok {
		return 0, fmt.Errorf("%w: %q", ErrUnknownOperation, op)
	}

	result, err := fn(operands)
	if err != nil {
		return 0, err
	}

	if math.IsInf(result, 0) || math.IsNaN(result) {
		return 0, ErrResultOutOfRange
	}

	return result, nil
}
