import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'dist/',
        'node_modules/',
        'test/setup.ts',
        'vitest.config.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
      ]
    }
  },
});
