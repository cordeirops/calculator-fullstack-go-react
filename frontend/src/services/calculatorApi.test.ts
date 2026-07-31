import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalculatorApiError } from '../types/calculator'
import { calculate, checkHealth } from './calculatorApi'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('calculatorApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('calculate', () => {
    it('posts the request and returns the parsed result on success', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ operation: 'add', operands: [2, 3], result: 5 }),
      )

      const result = await calculate({ operation: 'add', operands: [2, 3] })

      expect(result).toEqual({ operation: 'add', operands: [2, 3], result: 5 })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/calculate$/),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'add', operands: [2, 3] }),
        }),
      )
    })

    it('throws a CalculatorApiError built from the response body on failure', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        jsonResponse(
          { error: { code: 'DIVISION_BY_ZERO', message: 'cannot divide by zero' } },
          422,
        ),
      )

      await expect(calculate({ operation: 'divide', operands: [10, 0] })).rejects.toMatchObject({
        name: 'CalculatorApiError',
        code: 'DIVISION_BY_ZERO',
        message: 'cannot divide by zero',
        status: 422,
      })
    })

    it('falls back to a generic error when the error body is unparseable', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(new Response('not json', { status: 500 }))

      await expect(calculate({ operation: 'add', operands: [1, 1] })).rejects.toBeInstanceOf(
        CalculatorApiError,
      )
    })

    it('propagates network failures', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(calculate({ operation: 'add', operands: [1, 1] })).rejects.toThrow(
        'Failed to fetch',
      )
    })
  })

  describe('checkHealth', () => {
    it('returns true when the health endpoint responds ok', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'ok' }))

      await expect(checkHealth()).resolves.toBe(true)
    })

    it('returns false when the health endpoint responds with an error status', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 503))

      await expect(checkHealth()).resolves.toBe(false)
    })

    it('returns false when fetch throws', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(checkHealth()).resolves.toBe(false)
    })
  })
})
