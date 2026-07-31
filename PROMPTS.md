# AI Prompts Log

This file tracks the prompts used to drive AI-assisted development of this
project with Claude Code, as required by the take-home instructions. Each
entry has been reviewed and cleaned up (typos fixed, noise removed) rather
than pasted verbatim, and reflects what was actually asked at each step of
the process.

## 1. Initial brief

**Prompt:** A full product requirements document (PRD) for a full-stack
calculator challenge, specifying: React + TypeScript + Vite frontend, Go
backend (`net/http` or `chi`, no heavy framework), a single `POST
/calculate` endpoint with `{operation, operands}`, a defined error contract
(`400` for malformed input, `422` for semantic errors), mandatory edge
cases (division by zero, negative sqrt, wrong operand count, unknown
operation, non-numeric/null operands, malformed JSON), a required test
coverage target (>80% on business logic), Docker/docker-compose, a README
with Mermaid diagrams (architecture, sequence, use-case) and documented
complexity analysis, and a step-by-step execution order (repo scaffold →
calculator logic → HTTP handlers → frontend service → frontend UI →
integration → responsiveness → Docker → docs → commit review). All
repository deliverables (code, comments, error messages, README, this
file, commit messages, diagrams) had to be in English; the PRD itself
could stay in Portuguese.

**What was produced:** The full monorepo scaffold (`backend/`, `frontend/`
with the structure specified in the PRD), executed by following the
suggested step order, with a small commit after each step.

## 2. Environment setup

**Context:** The development machine had no Go toolchain installed.

**Prompt:** Asked how to proceed given the missing Go installation
(options: install via a package manager, install manually, or write
backend code without being able to compile/test it locally).

**What was produced:** A portable Go 1.23 install extracted to the user's
profile directory (no admin rights required, since the available package
manager needed elevation), with `PATH` updated persistently for the user.

## 3. Backend: calculator logic (step 2 of the execution order)

**Prompt:** Implement the pure arithmetic logic (`internal/calculator`)
for add, subtract, multiply, divide, power, sqrt, and percentage, using
the stdlib (`math.Pow`, `math.Sqrt`) rather than manual iteration, with
sentinel errors that distinguish malformed-input problems from semantic
ones, and table-driven tests covering success cases, floating-point
precision (`0.1 + 0.2`), overflow/NaN results, and concurrent use of the
package.

**What was produced:** `internal/calculator` with a dispatch-table
`Calculate(operation, operands)` entry point and 100% statement coverage.

## 4. Backend: HTTP layer (step 3)

**Prompt:** Wire the calculator package to `net/http` with `GET /health`
and `POST /calculate`, strict JSON operand validation (reject `null`,
strings, and booleans instead of silently coercing them), map calculator
errors to `400`/`422` with the `{error:{code,message}}` contract, add CORS
and `log/slog`-based structured logging, and cover it all with
`httptest`, including a concurrent-requests test.

**What was produced:** `internal/handler` and `cmd/server`, 98.1% handler
coverage.

## 5. Frontend: API service and hook (step 4)

**Prompt:** An isolated `calculatorApi.ts` service (the only module
allowed to call `fetch`) and a `useCalculator` hook owning all calculator
UI state, both covered by mocked Vitest tests.

**What was produced:** `src/services/calculatorApi.ts`,
`src/hooks/useCalculator.ts`, 100% statement coverage on both.

## 6. Frontend: UI components (step 5)

**Prompt:** Build the calculator UI on top of the hook: display, keypad
(all 7 operations plus clear/backspace/sign-toggle), an inline error
banner (explicitly not `window.alert()`), a bounded history list, and
full keyboard support, each piece covered by React Testing Library tests.

**What was produced:** `src/components/{Calculator,Display,Keypad,
ErrorMessage,History}`, plus a `formatExpression` utility. Verified
manually in a real browser against the running backend (successful
calculation, division-by-zero error path, CORS).

**Follow-up prompt:** ESLint flagged the keyboard-handling function for
exceeding the cyclomatic complexity cap of 10. Asked to refactor it.

**What was produced:** The flat if-chain was replaced with a small
lookup-table dispatch (`SIMPLE_KEY_ACTIONS`), bringing the function well
under the threshold without changing behavior.

## 7. Responsiveness (step 7)

**Prompt:** Verify the layout at mobile widths (375–480px) — no
horizontal overflow, reasonable touch targets.

**What was produced:** Confirmed via browser automation at both 375px and
480px (no horizontal scroll, ~44–48px touch targets); a real calculation
was run successfully at 375px width to confirm nothing broke functionally
at that viewport.

## 8. Docker (step 8)

**Prompt:** Multi-stage Dockerfiles (Go binary on `scratch`, Vite build
served by `nginx`) and a `docker-compose.yml` running both together, with
the frontend pointed at the backend via an environment variable.

**What was produced:** `backend/Dockerfile`, `frontend/Dockerfile`,
`frontend/nginx.conf`, `docker-compose.yml`. Built and ran the full stack
locally; verified a calculation round-trips correctly through the
containerized frontend and backend.

## 9. Code quality / complexity gates

**Prompt:** Run `golangci-lint`, `gocyclo -over 10`, and `gocognit -over
15` against the backend, and fix anything flagged.

**What was produced:** One `errcheck` finding (an unchecked
`resp.Body.Close()` in a test) fixed; no function in the backend exceeds
cyclomatic complexity 6 or cognitive complexity 8 (caps are 10 and 15
respectively). The frontend's ESLint config enforces the same caps via
the `complexity` rule and `eslint-plugin-sonarjs`'s
`cognitive-complexity` rule, and the build has zero lint warnings.

## 10. Documentation (step 9)

**Prompt:** Write the final README (setup instructions with and without
Docker, curl examples including an error case, design decisions and
trade-offs, assumptions, test/coverage instructions, complexity numbers),
an `openapi.yaml` spec, and Mermaid diagrams (architecture, sequence with
an error branch, use-case) with consistent, professional styling and
English-only labels — plus keep this file up to date.

**What was produced:** `README.md`, `openapi.yaml`, and this file.
