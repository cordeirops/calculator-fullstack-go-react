import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HistoryPanel } from './HistoryPanel'

const entries = [{ operation: 'add' as const, operands: [2, 3], result: 5 }]

describe('HistoryPanel', () => {
  it('is aria-hidden when closed', () => {
    render(<HistoryPanel isOpen={false} onClose={vi.fn()} entries={entries} onClear={vi.fn()} />)

    expect(screen.getByRole('complementary', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('is visible when open', () => {
    render(<HistoryPanel isOpen={true} onClose={vi.fn()} entries={entries} onClear={vi.fn()} />)

    expect(screen.getByRole('complementary')).toHaveAttribute('aria-hidden', 'false')
  })

  it('has no backdrop, so it never blocks interaction with the rest of the page', () => {
    const { container } = render(
      <HistoryPanel isOpen={true} onClose={vi.fn()} entries={entries} onClear={vi.fn()} />,
    )

    // Only the panel itself (and its children) should be in the tree — no
    // full-viewport overlay element.
    expect(container.querySelectorAll(':scope > *')).toHaveLength(1)
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<HistoryPanel isOpen={true} onClose={onClose} entries={entries} onClear={vi.fn()} />)

    await user.click(screen.getByTestId('history-close'))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders the given entries', () => {
    render(<HistoryPanel isOpen={true} onClose={vi.fn()} entries={entries} onClear={vi.fn()} />)

    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument()
  })
})
