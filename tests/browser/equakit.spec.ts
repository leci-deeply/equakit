import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

interface BrowserMathfieldElement extends HTMLElement {
  position: number;
  selection: { ranges: Array<[number, number]> };
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
  await expect(cards.locator('.demo-card__index')).toHaveText([
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
  ]);
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

  const stage = sample.getByTestId('formula-responsive-width-stage');
  const frame = sample.getByTestId('formula-responsive-width-frame');
  await expect(stage).toHaveCSS('display', 'flex');
  await expect(stage).toHaveCSS('align-items', 'center');
  await expect(frame).toHaveCSS('display', 'flex');
  await expect(frame).toHaveCSS('align-items', 'center');

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

test('Playground 不展示选择题示例', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '可访问的选择题' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '选择答案' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '在正文中插入和编辑公式' })).toHaveCount(0);
});

test('分步公式使用所见即所得输入并可增删步骤', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '解题过程转为公式步骤' }),
  });
  const mathfields = card.locator('math-field');

  await expect(mathfields).toHaveCount(3);
  await expect
    .poll(() =>
      mathfields.first().evaluate((element) => (element as BrowserMathfieldElement).value),
    )
    .toBe('x^2-5x+6=0');
  await expect(card).not.toContainText('$x^2-5x+6=0$');

  await card.getByRole('button', { name: /添加一步/ }).click();
  await expect(mathfields).toHaveCount(4);
  await card.getByRole('button', { name: '删除步骤' }).last().click();
  await expect(mathfields).toHaveCount(3);
});

test('多行解题过程可转换为所见即所得公式步骤', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '解题过程转为公式步骤' }),
  });
  const source = card.getByRole('textbox', { name: '粘贴解题过程' });
  const mathfields = card.locator('math-field');

  await source.fill('1. a+b=3\nA. a-b=1\n- a=2');
  await card.getByRole('button', { name: '转换为步骤' }).click();

  await expect(mathfields).toHaveCount(3);
  await expect
    .poll(() =>
      mathfields.first().evaluate((element) => (element as BrowserMathfieldElement).value),
    )
    .toBe('a+b=3');
  await expect
    .poll(() => mathfields.nth(1).evaluate((element) => (element as BrowserMathfieldElement).value))
    .toBe('a-b=1');
  await expect(card).not.toContainText('OCR');
});

test('解题过程转换在桌面保持清晰的左右流程', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '解题过程转为公式步骤' }),
  });
  const panels = card.locator('.demo-step-converter__panel');
  await expect(panels).toHaveCount(2);

  const [left, right] = await Promise.all([
    panels.nth(0).boundingBox(),
    panels.nth(1).boundingBox(),
  ]);
  expect(left).not.toBeNull();
  expect(right).not.toBeNull();
  expect(Math.abs(left!.height - right!.height)).toBeLessThanOrEqual(1);
});

test('Markdown 数学分隔符实时归一化并渲染', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '数学文本转换' }),
  });
  const source = card.getByRole('textbox', { name: '公式内容' });

  await source.fill(['面积为 \\(a^2\\)', '', '\\[', '\\frac{1}{2}', '\\]'].join('\n'));
  await expect(card.locator('.demo-transform-output .katex')).toHaveCount(2);
  await expect(card.locator('.demo-transform-output__status')).toHaveText(
    '已识别 1 个行内公式和 1 个块级公式',
  );
  await expect(card.getByText('圆的面积为 $S=\\pi r^2$。')).toHaveCount(0);
});

test('数学文本转换的左右面板保持等高', async ({ page }) => {
  const grids = page.locator('article .demo-transform-grid');
  await expect(grids).toHaveCount(2);

  for (let index = 0; index < (await grids.count()); index += 1) {
    const panels = grids.nth(index).locator(':scope > *');
    const [left, right] = await Promise.all([
      panels.nth(0).boundingBox(),
      panels.nth(1).boundingBox(),
    ]);
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(Math.abs(left!.height - right!.height)).toBeLessThanOrEqual(1);
  }
});

test('富文本中的正文、强调、列表和公式可恢复为 Markdown', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '富文本公式恢复' }),
  });
  const source = card.getByTestId('rich-math-source');

  await source.evaluate((element) => {
    const selection = document.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  const restored = await source.evaluate((element) => {
    const clipboardData = new DataTransfer();
    const event = new Event('copy', {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });
    element.dispatchEvent(event);
    return clipboardData.getData('text/plain');
  });

  expect(restored).toContain('**配方法**');
  expect(restored).toContain('- 配方得到');
  expect(restored).toContain('\\(x^2-6x+5=0\\)');
  expect(restored).toContain('\\[x=1\\quad\\text{或}\\quad x=5\\]');
  await card.getByRole('textbox', { name: '粘贴后的 Markdown + LaTeX' }).fill(restored);
});

test('步骤可在光标处拆分并通过双击边界键合并', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '步骤结构编辑' }),
  });
  const steps = card.locator('.demo-step-structure__row');
  const first = card.locator('math-field[aria-label="结构步骤 1"]');

  await expect(card.locator('math-field')).toHaveCount(3);
  await expect(card.locator('textarea')).toHaveCount(0);
  const firstKeyboardSink = first.locator('[part~="keyboard-sink"]');
  await firstKeyboardSink.waitFor({ state: 'attached' });
  await first.evaluate((element) => {
    const mathfield = element as BrowserMathfieldElement & { position: number };
    mathfield.shadowRoot?.querySelector<HTMLElement>('[part~="keyboard-sink"]')?.focus();
    mathfield.position = 3;
  });
  await page.keyboard.press('Enter');
  await expect(steps).toHaveCount(4);

  const splitStep = card.locator('math-field[aria-label="结构步骤 2"]');
  const splitKeyboardSink = splitStep.locator('[part~="keyboard-sink"]');
  await splitKeyboardSink.waitFor({ state: 'attached' });
  await splitStep.evaluate((element) => {
    const mathfield = element as BrowserMathfieldElement;
    mathfield.shadowRoot?.querySelector<HTMLElement>('[part~="keyboard-sink"]')?.focus();
    mathfield.position = 0;
  });
  await expect
    .poll(() =>
      splitStep.evaluate((element) => {
        const mathfield = element as BrowserMathfieldElement;
        return {
          active: document.activeElement === mathfield,
          position: mathfield.position,
          range: mathfield.selection.ranges[0],
        };
      }),
    )
    .toEqual({ active: true, position: 0, range: [0, 0] });
  await page.keyboard.press('Backspace');
  await expect(card.locator('.demo-step-structure__status')).toHaveText(
    '再次按相同按键以合并相邻步骤。',
  );
  await expect(steps).toHaveCount(4);
  await page.waitForTimeout(80);
  await splitStep.evaluate((element) => {
    const mathfield = element as BrowserMathfieldElement;
    mathfield.shadowRoot?.querySelector<HTMLElement>('[part~="keyboard-sink"]')?.focus();
    mathfield.position = 0;
  });
  await expect
    .poll(() =>
      splitStep.evaluate((element) => {
        const mathfield = element as BrowserMathfieldElement;
        return {
          active: document.activeElement === mathfield,
          position: mathfield.position,
          range: mathfield.selection.ranges[0],
        };
      }),
    )
    .toEqual({ active: true, position: 0, range: [0, 0] });
  await page.keyboard.press('Backspace');
  await expect(steps).toHaveCount(3);
});

test('页面通过自动无障碍规则扫描且关键控件具有可访问名称', async ({ page }) => {
  await expect(page.getByRole('toolbar', { name: '公式面板' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '常用' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '可视化公式输入区' })).toBeVisible();
  await expect(page.getByRole('group', { name: '步骤 1公式' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
