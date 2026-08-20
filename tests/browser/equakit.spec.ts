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

test('可视化公式输入是首个交互示例', async ({ page }) => {
  const cards = page.locator('.demo-grid > .demo-card');

  await expect(cards.first().getByRole('heading', { name: '可视化公式输入' })).toBeVisible();
  await expect(cards.locator('.demo-card__index')).toHaveText(['01', '02', '03', '04', '05']);
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

test('窄容器公式可键盘访问且显示按需滚动提示', async ({ page, browserName }) => {
  const overflowing = page
    .getByTestId('formula-responsive-width-sample')
    .locator('.katex-display > .katex');
  await expect(overflowing).toHaveClass(/mre-math-overflowing/);
  await expect(overflowing).toHaveAttribute('tabindex', '0');
  const dimensions = await overflowing.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);

  await overflowing.focus();
  for (let index = 0; index < 5; index += 1) await page.keyboard.press('ArrowRight');
  await expect.poll(() => overflowing.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

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

test('缺少 CSS Font Loading API 时滚动提示检测仍能工作', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: undefined,
    });
  });
  await page.reload();

  expect(await page.evaluate(() => typeof document.fonts)).toBe('undefined');
  await expect(
    page.getByTestId('formula-responsive-width-sample').locator('.katex-display > .katex'),
  ).toHaveAttribute('tabindex', '0');
});

test('容器宽度变化时滚动提示自动出现并消失', async ({ page }) => {
  const sample = page.getByTestId('formula-responsive-width-sample');
  const slider = sample.getByRole('slider', { name: '容器宽度' });
  const formula = sample.locator('.katex-display > .katex');

  await slider.fill('220');
  await expect(sample.locator('output')).toHaveText('220px');
  await expect(formula).toHaveClass(/mre-math-overflowing/);

  await slider.fill('640');
  await expect(sample.locator('output')).toHaveText('640px');
  await expect(formula).not.toHaveClass(/mre-math-overflowing/);
});

test('复制左侧公式后可粘贴到右侧并继续可视化编辑', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Firefox 和 WebKit 在 Playwright 中没有稳定开放系统剪贴板 readText() 权限。',
  );

  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '公式复制与继续编辑' }),
  });
  const source = card.getByRole('math', { name: '高斯积分' });
  const target = card.locator('math-field');

  await source.evaluate((element) => {
    const selection = document.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press('ControlOrMeta+C');

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('\\int_0^\\infty');

  await target.focus();
  await page.keyboard.press('ControlOrMeta+V');
  await expect
    .poll(() => target.evaluate((element) => (element as BrowserMathfieldElement).value))
    .toContain('\\int_0^\\infty');
  await page.keyboard.type('+1');
  await expect
    .poll(() => target.evaluate((element) => (element as BrowserMathfieldElement).value))
    .toContain('+1');
});

test('单公式复制写入 LaTeX、MathML、AsciiMath 和 MathJSON MIME', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '公式复制与继续编辑' }),
  });
  const formula = card.getByRole('math', { name: '高斯积分' });
  await expect(formula).toBeVisible();

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

test('视觉矩阵公式可复制到可视化粘贴区域', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Firefox 和 WebKit 在 Playwright 中没有稳定开放系统剪贴板权限。',
  );

  const formula = page.getByRole('math', { name: '视觉公式 1' });
  const target = page.locator('math-field[aria-label="公式粘贴输入区"]');
  await formula.evaluate((element) => {
    const selection = document.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });

  await page.keyboard.press('ControlOrMeta+C');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');

  await target.focus();
  await page.keyboard.press('ControlOrMeta+V');
  await expect
    .poll(() => target.evaluate((element) => (element as BrowserMathfieldElement).value))
    .toContain('\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
});

test('可视化公式输入区直接编辑且不渲染公式面板', async ({ page }) => {
  const failedAssets: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && /\/(?:fonts|sounds)\//.test(response.url())) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.reload();

  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '可视化公式输入' }),
  });
  const mathfield = card.locator('math-field');

  await expect(mathfield).toHaveAttribute('aria-label', '可视化公式输入区');
  await expect(card.getByRole('toolbar', { name: '公式面板' })).toHaveCount(0);
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
  await expect(page.getByRole('toolbar', { name: '公式面板' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '常用' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '可视化公式输入区' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '步骤 1' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
