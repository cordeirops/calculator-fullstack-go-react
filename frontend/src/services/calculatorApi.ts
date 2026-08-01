import {
  CalculatorApiError,
  type CalculateRequest,
  type CalculateResponse,
} from '../types/calculator'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
  }
}

async function parseErrorResponse(response: Response): Promise<CalculatorApiError> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null
  return new CalculatorApiError(
    payload?.error?.code ?? 'UNKNOWN_ERROR',
    payload?.error?.message ?? 'Unexpected error calling the calculator API',
    response.status,
  )
}

// calculate is the sole entry point components use to reach the backend;
// no component should call fetch directly.
export async function calculate(request: CalculateRequest): Promise<CalculateResponse> {
  const response = await fetch(`${API_BASE_URL}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  return (await response.json()) as CalculateResponse
}
