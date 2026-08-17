import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@equakit/adapter-mathlive': fileURLToPath(
        new URL('./packages/adapter-mathlive/src/index.ts', import.meta.url),
      ),
      '@equakit/adapter-tiptap': fileURLToPath(
        new URL('./packages/adapter-tiptap/src/index.ts', import.meta.url),
      ),
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
