import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

interface BrowserMathfieldElement extends HTMLElement {
  value: string;
  setValue: (value: string, options?: { silenceNotifications?: boolean }) => void;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Playground 提供 API 文档和 GitHub 导航', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'API 文档' })).toHaveAttribute('href', '/api/');
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/leci-deeply/equakit',
  );
});

test('高公式按字形撑开且不会覆盖后续正文', async ({ page }) => {
  const sample = page.getByTestId('formula-height-sample');
  const formula = sample.locator('.mre-math-formula--display');
  const glyphs = formula.locator('.katex');
  const following = sample.getByTestId('formula-height-following');

  const geometry = await Promise.all([
    formula.boundingBox(),
    glyphs.boundingBox(),
    following.boundingBox(),
  ]);
  const [formulaBox, glyphBox, followingBox] = geometry;
  expect(formulaBox).not.toBeNull();
  expect(glyphBox).not.toBeNull();
  expect(followingBox).not.toBeNull();
  expect(glyphBox!.y).toBeGreaterThanOrEqual(formulaBox!.y - 1);
  expect(glyphBox!.y + glyphBox!.height).toBeLessThanOrEqual(
    formulaBox!.y + formulaBox!.height + 1,
  );
  expect(followingBox!.y).toBeGreaterThanOrEqual(formulaBox!.y + formulaBox!.height - 1);
});

test('所有超宽公式均可键盘访问且视觉提示保持按需启用', async ({ page, browserName }) => {
  const overflowing = page
    .getByTestId('formula-overflow-sample')
    .locator('.katex-display > .katex');
  const defaultOverflowing = page
    .getByTestId('formula-default-overflow-sample')
    .locator('.katex-display > .katex');
  const directOverflowing = page
    .getByTestId('formula-direct-overflow-sample')
    .locator('.mre-math-formula__scroll');
  const short = page.getByTestId('formula-short-sample').locator('.katex');

  for (const formula of [overflowing, defaultOverflowing, directOverflowing]) {
    await expect(formula).toHaveClass(/mre-math-overflowing/);
    await expect(formula).toHaveAttribute('tabindex', '0');
    const dimensions = await formula.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);

    await formula.focus();
    for (let index = 0; index < 5; index += 1) await page.keyboard.press('ArrowRight');
    await expect.poll(() => formula.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  }

  await expect(
    page.getByTestId('formula-default-overflow-sample').locator('.mre-markdown-math'),
  ).not.toHaveClass(/mre-markdown-math--overflow-aware/);
  await expect(short).not.toHaveClass(/mre-math-overflowing/);
  await expect(short).not.toHaveAttribute('tabindex');

  if (browserName === 'chromium') {
    await overflowing.hover();
    const scrollbar = await overflowing.evaluate((element) => {
      const style = getComputedStyle(element, '::-webkit-scrollbar');
      return { display: style.display, height: style.height };
    });
    expect(scrollbar.display).toBe('block');
    expect(scrollbar.height).toBe('5px');
  }
});

test('缺少 CSS Font Loading API 时公式溢出检测仍能工作', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: undefined,
    });
  });
  await page.reload();

  expect(await page.evaluate(() => typeof document.fonts)).toBe('undefined');
  await expect(
    page.getByTestId('formula-default-overflow-sample').locator('.katex-display > .katex'),
  ).toHaveAttribute('tabindex', '0');
  await expect(
    page.getByTestId('formula-direct-overflow-sample').locator('.mre-math-formula__scroll'),
  ).toHaveAttribute('tabindex', '0');
});

test('把浏览器选区中的渲染公式复制为可编辑 LaTeX', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Firefox 和 WebKit 在 Playwright 中没有稳定开放系统剪贴板 readText() 权限。',
  );

  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: 'Markdown 与复制恢复' }),
  });
  const boundary = card.locator('.mre-copy-boundary');
  await boundary.evaluate((element) => {
    const selection = document.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });

  await page.keyboard.press('ControlOrMeta+C');
  const copied = await page.evaluate(() => navigator.clipboard.readText());

  expect(copied).toContain('高斯函数的傅里叶变换');
  expect(copied).toContain('\\(f(x)=e^{-\\pi x^2}\\)');
  expect(copied).toContain('\\widehat{f}');
});

test('单公式复制写入 LaTeX、MathML、AsciiMath 和 MathJSON MIME', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '多格式公式复制' }),
  });
  await expect(card.getByRole('status')).toHaveText('多格式转换器已加载。');
  const formula = card.getByRole('math', { name: '高斯积分' });

  await formula.evaluate((element) => {
    const selection = document.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  const captured = await formula.evaluate((element) => {
    const clipboardData = new DataTransfer();
    const event = new Event('copy', {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });
    element.dispatchEvent(event);

    const payload: Record<string, string> = {};
    for (const mimeType of clipboardData.types) {
      payload[mimeType] = clipboardData.getData(mimeType);
    }
    return payload;
  });
  expect(captured['text/plain']).toBe(
    '\\(\\int_0^\\infty e^{-x^2}\\,\\mathrm{d}x=\\frac{\\sqrt{\\pi}}{2}\\)',
  );
  expect(captured['application/x-latex']).toBe(
    '\\int_0^\\infty e^{-x^2}\\,\\mathrm{d}x=\\frac{\\sqrt{\\pi}}{2}',
  );
  expect(captured['application/mathml+xml']).toContain('<math');
  expect(captured['text/asciimath']).toContain('int');
  expect(JSON.parse(captured['application/vnd.equakit.mathjson+json'] ?? 'null')).toBeTruthy();
});

test('可视化输入区与公式键盘左右排列并直接插入公式', async ({ page }) => {
  const failedAssets: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && /\/(?:fonts|sounds)\//.test(response.url())) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.reload();

  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '公式键盘输入' }),
  });
  const mathfield = card.locator('math-field');
  const keyboard = card.getByRole('toolbar', { name: '公式面板' });

  await expect(mathfield).toHaveAttribute('aria-label', '可视化公式输入区');
  await expect(mathfield).toHaveAttribute('role', 'group');
  await expect(mathfield).not.toHaveAttribute('contenteditable');
  await expect
    .poll(() =>
      mathfield.evaluate((element) =>
        element.shadowRoot?.querySelector('[part~="keyboard-sink"]')?.getAttribute('aria-label'),
      ),
    )
    .toBe('可视化公式输入区');
  await expect
    .poll(() => mathfield.evaluate((element) => (element as BrowserMathfieldElement).value))
    .toBe('\\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}');

  const [inputBox, keyboardBox] = await Promise.all([
    mathfield.boundingBox(),
    keyboard.boundingBox(),
  ]);
  expect(inputBox).not.toBeNull();
  expect(keyboardBox).not.toBeNull();
  expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(keyboardBox!.x);

  await mathfield.evaluate((element) => {
    (element as BrowserMathfieldElement).setValue('', { silenceNotifications: true });
    element.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'deleteContent',
      }),
    );
  });
  await card.getByRole('button', { name: '分式', exact: true }).click();

  await expect
    .poll(() => mathfield.evaluate((element) => (element as BrowserMathfieldElement).value))
    .toContain('\\frac');
  await mathfield.focus();
  await expect(card.locator('[part~="keyboard-sink"]')).toBeFocused();
  await page.keyboard.type('1');
  await expect
    .poll(() => mathfield.evaluate((element) => (element as BrowserMathfieldElement).value))
    .toContain('1');
  await expect(card.getByRole('region', { name: '预览' })).toHaveCount(0);
  expect(failedAssets).toEqual([]);
});

test('TipTap adapter 渲染并插入 inline/block 数学节点', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: 'TipTap inline/block 数学节点' }),
  });
  const editor = card.getByRole('textbox', { name: 'TipTap 数学编辑器' });
  const inlineMath = editor.locator('[data-type="inline-math"]');
  const blockMath = editor.locator('[data-type="block-math"]');

  await expect(inlineMath).toHaveCount(1);
  await expect(inlineMath).toHaveAttribute('data-latex', 'E=mc^2');
  await expect(blockMath).toHaveCount(1);
  await expect(blockMath).toHaveAttribute(
    'data-latex',
    '\\int_{-\\infty}^{\\infty}e^{-x^2}\\,\\mathrm{d}x=\\sqrt{\\pi}',
  );

  await card.getByRole('button', { name: '插入行内公式' }).click();
  await expect(inlineMath).toHaveCount(2);
  await expect
    .poll(() =>
      inlineMath.evaluateAll((elements) => elements.map((element) => element.dataset.latex)),
    )
    .toContain('\\sqrt{x}');

  await card.getByRole('button', { name: '插入块级公式' }).click();
  await expect(blockMath).toHaveCount(2);
  await expect
    .poll(() =>
      blockMath.evaluateAll((elements) => elements.map((element) => element.dataset.latex)),
    )
    .toContain('\\sum_{i=1}^{n} i');
});

test('TipTap adapter 支持 EquaKit 剪贴板复制', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Firefox 和 WebKit 在 Playwright 中没有稳定开放系统剪贴板 readText() 权限。',
  );

  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: 'TipTap inline/block 数学节点' }),
  });
  const editor = card.getByRole('textbox', { name: 'TipTap 数学编辑器' });

  await card.getByRole('button', { name: '插入块级公式' }).click();
  await expect(editor.locator('[data-type="block-math"]')).toHaveCount(2);

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+C');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('\\(E=mc^2\\)');
  expect(copied).toContain('\\[\\sum_{i=1}^{n} i\\]');
});

test('TipTap adapter 迁移旧公式文本时不把价格识别为数学节点', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: 'TipTap inline/block 数学节点' }),
  });
  const editor = card.getByRole('textbox', { name: 'TipTap 数学编辑器' });

  await card.getByRole('button', { name: '迁移旧公式文本' }).click();

  await expect(editor.locator('[data-type="inline-math"]')).toHaveCount(1);
  await expect(editor.locator('[data-type="inline-math"]')).toHaveAttribute('data-latex', 'a+b');
  await expect(editor).toContainText('价格 $100$，旧公式');
});

test('Playground 不展示选择题示例', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '可访问的选择题' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '选择答案' })).toHaveCount(0);
});

test('页面通过自动无障碍规则扫描且关键控件具有可访问名称', async ({ page }) => {
  await expect(page.getByRole('toolbar', { name: '公式面板' })).toHaveCount(1);
  await expect(page.getByRole('group', { name: '常用' })).toHaveCount(1);
  await expect(page.getByRole('group', { name: '可视化公式输入区' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '步骤 1' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
