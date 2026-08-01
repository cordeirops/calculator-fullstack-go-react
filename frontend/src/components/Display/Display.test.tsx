import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Display } from './Display'

describe('Display', () => {
  it('renders the given value', () => {
    render(<Display value="42" isLoading={false} expression={null} />)

    expect(screen.getByTestId('display-value')).toHaveTextContent('42')
  })

  it('shows a skeleton instead of the value while loading', () => {
    render(<Display value="0" isLoading={true} expression={null} />)

    expect(screen.getByTestId('display-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('display-value')).not.toBeInTheDocument()
  })

  it('does not show a skeleton when not loading', () => {
    render(<Display value="0" isLoading={false} expression={null} />)

    expect(screen.queryByTestId('display-skeleton')).not.toBeInTheDocument()
  })

  it('shows no pending expression text when expression is null', () => {
    render(<Display value="0" isLoading={false} expression={null} />)

    expect(screen.getByTestId('display-expression')).toHaveTextContent('')
  })

  it('shows the pending expression above the value', () => {
    render(<Display value="3" isLoading={false} expression="5 ×" />)

    expect(screen.getByTestId('display-expression')).toHaveTextContent('5 ×')
    expect(screen.getByTestId('display-value')).toHaveTextContent('3')
  })

  describe('copy to clipboard', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('copies the value and shows a badge on click, which fades after a delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
      render(<Display value="42" isLoading={false} expression={null} />)

      await user.click(screen.getByRole('button', { name: 'Copy result to clipboard' }))

      expect(writeText).toHaveBeenCalledWith('42')
      expect(screen.getByTestId('display-copied-badge')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(screen.queryByTestId('display-copied-badge')).not.toBeInTheDocument()
    })

    it('copies the value on Enter key press', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
      render(<Display value="7" isLoading={false} expression={null} />)

      screen.getByRole('button', { name: 'Copy result to clipboard' }).focus()
      await user.keyboard('{Enter}')

      expect(writeText).toHaveBeenCalledWith('7')
    })

    it('does not copy while loading', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
      render(<Display value="7" isLoading={true} expression={null} />)

      await user.click(screen.getByRole('button', { name: 'Copy result to clipboard' }))

      expect(writeText).not.toHaveBeenCalled()
    })

    it('fails silently when the clipboard write rejects', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
      render(<Display value="7" isLoading={false} expression={null} />)

      await user.click(screen.getByRole('button', { name: 'Copy result to clipboard' }))

      expect(screen.queryByTestId('display-copied-badge')).not.toBeInTheDocument()
    })
  })
})
