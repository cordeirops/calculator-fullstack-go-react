import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia; useTheme relies on it to detect the
// OS-level color scheme when no preference is stored yet.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// jsdom doesn't implement the Clipboard API either; Display uses it to copy
// the current result. Individual tests can still vi.spyOn this to assert
// calls or simulate failures.
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  })
}
