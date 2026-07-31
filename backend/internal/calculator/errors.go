package calculator

import "errors"

// Sentinel errors returned by Calculate. Callers should use errors.Is to
// distinguish between malformed-input errors (unknown operation, wrong
// operand count) and semantic/domain errors (division by zero, negative
// square root, non-finite result), since each maps to a different HTTP
// status code at the transport layer.
var (
	ErrUnknownOperation    = errors.New("unknown operation")
	ErrInvalidOperandCount = errors.New("invalid operand count for operation")
	ErrDivisionByZero      = errors.New("cannot divide by zero")
	ErrNegativeSqrtOperand = errors.New("cannot take square root of a negative number")
	ErrResultOutOfRange    = errors.New("result is not a finite number")
)
