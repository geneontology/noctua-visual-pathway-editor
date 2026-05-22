import '@testing-library/jest-dom/vitest'

// jsdom lacks window.matchMedia; Mantine's MantineProvider color-scheme logic
// calls it on mount. Provide a stub so component tests can render Mantine
// components (Modal, etc.) without crashing.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
