import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when there is no message', () => {
    const { container } = render(<ErrorMessage message={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message in an alert region', () => {
    render(<ErrorMessage message="cannot divide by zero" />)

    expect(screen.getByRole('alert')).toHaveTextContent('cannot divide by zero')
  })

  it('auto-dismisses and unmounts after the fade-out transition completes', () => {
    render(<ErrorMessage message="cannot divide by zero" />)
    const toast = screen.getByRole('alert')

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    fireEvent.transitionEnd(toast)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not unmount on transitionend while still visible', () => {
    render(<ErrorMessage message="cannot divide by zero" />)
    const toast = screen.getByRole('alert')

    fireEvent.transitionEnd(toast)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('removes the toast when the message is cleared before the timeout', () => {
    const { rerender } = render(<ErrorMessage message="cannot divide by zero" />)
    rerender(<ErrorMessage message={null} />)
    const toast = screen.getByRole('alert')

    fireEvent.transitionEnd(toast)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
