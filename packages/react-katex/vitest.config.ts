import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@equakit/katex-engine': fileURLToPath(
        new URL('../katex-engine/src/index.ts', import.meta.url),
      ),
      '@equakit/math-text': fileURLToPath(new URL('../math-text/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
