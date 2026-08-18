import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@equakit/react-markdown-math': fileURLToPath(
        new URL('../react-markdown-math/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
