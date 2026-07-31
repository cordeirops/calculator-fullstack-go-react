import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Display } from './Display'

describe('Display', () => {
  it('renders the given value', () => {
    render(<Display value="42" isLoading={false} />)

    expect(screen.getByTestId('display-value')).toHaveTextContent('42')
  })

  it('does not show a loading spinner when not loading', () => {
    render(<Display value="0" isLoading={false} />)

    expect(screen.queryByTestId('display-spinner')).not.toBeInTheDocument()
  })

  it('shows a loading spinner while loading', () => {
    render(<Display value="0" isLoading={true} />)

    expect(screen.getByTestId('display-spinner')).toBeInTheDocument()
  })
})
