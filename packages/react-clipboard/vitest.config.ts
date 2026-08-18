import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@equakit/clipboard-formats': fileURLToPath(
        new URL('../clipboard-formats/src/index.ts', import.meta.url),
      ),
      '@equakit/clipboard-restore': fileURLToPath(
        new URL('../clipboard-restore/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
