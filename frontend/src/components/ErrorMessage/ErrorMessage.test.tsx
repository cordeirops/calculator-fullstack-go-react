import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<ErrorMessage message={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message in an alert region', () => {
    render(<ErrorMessage message="cannot divide by zero" />)

    expect(screen.getByRole('alert')).toHaveTextContent('cannot divide by zero')
  })
})
