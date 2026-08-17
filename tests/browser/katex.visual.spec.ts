import { expect, test } from '@playwright/test';

test('KaTeX 代表公式矩阵保持视觉稳定', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  const matrix = page.getByTestId('katex-visual-matrix');
  await matrix.scrollIntoViewIfNeeded();

  await expect(matrix).toHaveScreenshot('katex-matrix.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03,
    scale: 'css',
    threshold: 0.2,
  });
});
