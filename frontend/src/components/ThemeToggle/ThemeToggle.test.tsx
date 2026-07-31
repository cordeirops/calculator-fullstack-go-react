import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('starts labeled for switching to dark when the theme is light', () => {
    window.localStorage.setItem('theme', 'light')
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('toggles the label and the document theme attribute on click', async () => {
    window.localStorage.setItem('theme', 'light')
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
