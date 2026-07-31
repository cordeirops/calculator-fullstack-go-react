import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { History } from './History'

describe('History', () => {
  it('shows an empty state and no clear button when there are no entries', () => {
    render(<History entries={[]} onClear={vi.fn()} />)

    expect(screen.getByText('No calculations yet')).toBeInTheDocument()
    expect(screen.queryByTestId('history-clear')).not.toBeInTheDocument()
  })

  it('renders each entry as a formatted expression', () => {
    render(
      <History
        entries={[
          { operation: 'add', operands: [2, 3], result: 5 },
          { operation: 'sqrt', operands: [16], result: 4 },
        ]}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument()
    expect(screen.getByText('√16 = 4')).toBeInTheDocument()
  })

  it('calls onClear when the clear button is clicked', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(
      <History entries={[{ operation: 'add', operands: [2, 3], result: 5 }]} onClear={onClear} />,
    )

    await user.click(screen.getByTestId('history-clear'))

    expect(onClear).toHaveBeenCalledOnce()
  })
})
