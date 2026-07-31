import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { History } from './History'

describe('History', () => {
  it('shows an empty state when there are no entries', () => {
    render(<History entries={[]} />)

    expect(screen.getByText('No calculations yet')).toBeInTheDocument()
  })

  it('renders each entry as a formatted expression', () => {
    render(
      <History
        entries={[
          { operation: 'add', operands: [2, 3], result: 5 },
          { operation: 'sqrt', operands: [16], result: 4 },
        ]}
      />,
    )

    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument()
    expect(screen.getByText('√16 = 4')).toBeInTheDocument()
  })
})
