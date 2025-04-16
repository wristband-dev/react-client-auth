import '@testing-library/jest-dom';

// Use window instead of global for browser environment
window.console = {
  ...console,
  // Uncomment to hide log messages during tests
  // log: vi.fn(),
  // error: vi.fn(),
  // warn: vi.fn(),
};
