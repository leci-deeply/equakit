import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@equakit/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@equakit/react': fileURLToPath(new URL('./packages/react/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
