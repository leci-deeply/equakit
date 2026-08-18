import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@equakit/answer-steps': fileURLToPath(
        new URL('./packages/answer-steps/src/index.ts', import.meta.url),
      ),
      '@equakit/async-guard': fileURLToPath(
        new URL('./packages/async-guard/src/index.ts', import.meta.url),
      ),
      '@equakit/choice': fileURLToPath(new URL('./packages/choice/src/index.ts', import.meta.url)),
      '@equakit/clipboard-formats': fileURLToPath(
        new URL('./packages/clipboard-formats/src/index.ts', import.meta.url),
      ),
      '@equakit/clipboard-restore': fileURLToPath(
        new URL('./packages/clipboard-restore/src/index.ts', import.meta.url),
      ),
      '@equakit/katex-engine': fileURLToPath(
        new URL('./packages/katex-engine/src/index.ts', import.meta.url),
      ),
      '@equakit/math-text': fileURLToPath(
        new URL('./packages/math-text/src/index.ts', import.meta.url),
      ),
      '@equakit/adapter-mathlive': fileURLToPath(
        new URL('./packages/adapter-mathlive/src/index.ts', import.meta.url),
      ),
      '@equakit/adapter-tiptap': fileURLToPath(
        new URL('./packages/adapter-tiptap/src/index.ts', import.meta.url),
      ),
      '@equakit/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@equakit/mathlive-editor': fileURLToPath(
        new URL('./packages/mathlive-editor/src/index.ts', import.meta.url),
      ),
      '@equakit/mathlive-formats': fileURLToPath(
        new URL('./packages/mathlive-formats/src/index.ts', import.meta.url),
      ),
      '@equakit/react': fileURLToPath(new URL('./packages/react/src/index.ts', import.meta.url)),
      '@equakit/react-answer-steps': fileURLToPath(
        new URL('./packages/react-answer-steps/src/index.ts', import.meta.url),
      ),
      '@equakit/react-choice': fileURLToPath(
        new URL('./packages/react-choice/src/index.ts', import.meta.url),
      ),
      '@equakit/react-clipboard': fileURLToPath(
        new URL('./packages/react-clipboard/src/index.ts', import.meta.url),
      ),
      '@equakit/react-formula-input': fileURLToPath(
        new URL('./packages/react-formula-input/src/index.ts', import.meta.url),
      ),
      '@equakit/react-katex': fileURLToPath(
        new URL('./packages/react-katex/src/index.ts', import.meta.url),
      ),
      '@equakit/react-markdown-math': fileURLToPath(
        new URL('./packages/react-markdown-math/src/index.ts', import.meta.url),
      ),
      '@equakit/tiptap-math': fileURLToPath(
        new URL('./packages/tiptap-math/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
