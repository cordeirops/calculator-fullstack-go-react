import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to the system color scheme when nothing is stored', () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    )

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
  })

  it('prefers a previously stored theme over the system preference', () => {
    window.localStorage.setItem('theme', 'light')
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    )

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('toggles between light and dark, persisting to localStorage and the DOM', () => {
    window.localStorage.setItem('theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
    expect(window.localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
