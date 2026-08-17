import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

interface BrowserMathfieldElement extends HTMLElement {
  value: string;
  setValue: (value: string, options?: { silenceNotifications?: boolean }) => void;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('把浏览器选区中的渲染公式复制为可编辑 LaTeX', async ({ page }) => {
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

  expect(copied).toContain('安全的数学富文本工作流');
  expect(copied).toContain('\\(f(x)=x^2+1\\)');
  expect(copied).toContain('\\(\\int_0^1 x^2\\,\\mathrm{d}x=\\frac{1}{3}\\)');
});

test('单公式复制写入 LaTeX、MathML、AsciiMath 和 MathJSON MIME', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '多格式公式复制' }),
  });
  await expect(card.getByRole('status')).toHaveText('多格式转换器已加载。');
  const formula = card.getByRole('math', { name: '二分之一' });

  await page.evaluate(() => {
    document.addEventListener(
      'copy',
      (event) => {
        if (!(event instanceof ClipboardEvent) || !event.clipboardData) return;
        const payload: Record<string, string> = {};
        for (const mimeType of event.clipboardData.types) {
          payload[mimeType] = event.clipboardData.getData(mimeType);
        }
        Object.assign(globalThis, { __equakitClipboardPayload: payload });
      },
      { once: true },
    );
  });
  await formula.evaluate((element) => {
    const selection = document.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press('ControlOrMeta+C');

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            globalThis as typeof globalThis & {
              __equakitClipboardPayload?: Record<string, string>;
            }
          ).__equakitClipboardPayload,
      ),
    )
    .not.toBeUndefined();

  const captured = await page.evaluate(
    () =>
      (
        globalThis as typeof globalThis & {
          __equakitClipboardPayload?: Record<string, string>;
        }
      ).__equakitClipboardPayload ?? {},
  );
  expect(captured['text/plain']).toBe('\\(\\frac{1}{2}\\)');
  expect(captured['application/x-latex']).toBe('\\frac{1}{2}');
  expect(captured['application/mathml+xml']).toContain('<math');
  expect(captured['text/asciimath']).toBe('(1)/(2)');
  expect(JSON.parse(captured['application/vnd.equakit.mathjson+json'] ?? 'null')).toEqual([
    'Divide',
    1,
    2,
  ]);
});

test('公式面板在当前选区插入片段并把光标放进占位符', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: '公式输入', exact: true }),
  });
  const textarea = card.getByRole('textbox', { name: '公式源码' });
  await textarea.fill('ab');
  await textarea.evaluate((element) => {
    (element as HTMLTextAreaElement).setSelectionRange(1, 1);
  });

  await card.getByRole('button', { name: '分式', exact: true }).click();

  await expect(textarea).toHaveValue('a\\frac{}{}b');
  await expect(textarea).toHaveJSProperty('selectionStart', 7);
  await expect(textarea).toHaveJSProperty('selectionEnd', 7);

  await textarea.pressSequentially('1');
  await expect(textarea).toHaveValue('a\\frac{1}{}b');
});

test('Chromium IME composition 期间保持受控输入值并正常提交中文', async ({ page }) => {
  const textarea = page.getByRole('textbox', { name: '公式源码', exact: true });
  await textarea.fill('');
  await textarea.focus();
  await textarea.evaluate((element) => {
    const events: string[] = [];
    for (const type of ['compositionstart', 'compositionupdate', 'compositionend']) {
      element.addEventListener(type, () => events.push(type));
    }
    Object.assign(globalThis, { __equakitImeEvents: events });
  });

  const session = await page.context().newCDPSession(page);
  await session.send('Input.imeSetComposition', {
    replacementEnd: 0,
    replacementStart: 0,
    selectionEnd: 2,
    selectionStart: 2,
    text: '函数',
  });
  await expect(textarea).toHaveValue('函数');

  await session.send('Input.imeSetComposition', {
    replacementEnd: 2,
    replacementStart: 0,
    selectionEnd: 3,
    selectionStart: 3,
    text: '函数值',
  });
  await expect(textarea).toHaveValue('函数值');

  await session.send('Input.insertText', { text: '函数值' });
  await expect(textarea).toHaveValue('函数值');
  const events = await page.evaluate(
    () =>
      (globalThis as typeof globalThis & { __equakitImeEvents?: string[] }).__equakitImeEvents ??
      [],
  );
  expect(events[0]).toBe('compositionstart');
  expect(events.at(-1)).toBe('compositionend');
  expect(events.filter((event) => event === 'compositionupdate').length).toBeGreaterThanOrEqual(2);
});

test('MathLive adapter 按需加载并使用结构化占位符插入公式', async ({ page }) => {
  const failedAssets: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && /\/(?:fonts|sounds)\//.test(response.url())) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.reload();

  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: 'MathLive 可选输入' }),
  });
  const mathfield = card.locator('math-field');

  await expect(mathfield).toHaveAttribute('aria-label', 'MathLive 公式源码');
  await expect(mathfield).toHaveAttribute('role', 'group');
  await expect(mathfield).not.toHaveAttribute('contenteditable');
  await expect
    .poll(() =>
      mathfield.evaluate((element) =>
        element.shadowRoot?.querySelector('[part~="keyboard-sink"]')?.getAttribute('aria-label'),
      ),
    )
    .toBe('MathLive 公式源码');
  await expect
    .poll(() => mathfield.evaluate((element) => (element as BrowserMathfieldElement).value))
    .toBe('x^2+1');

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
  await expect(card.getByRole('region', { name: 'MathLive 预览' })).toContainText('1');
  expect(failedAssets).toEqual([]);
});

test('TipTap adapter 渲染并插入 inline/block 数学节点且支持 EquaKit 复制', async ({ page }) => {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: 'TipTap inline/block 数学节点' }),
  });
  const editor = card.getByRole('textbox', { name: 'TipTap 数学编辑器' });
  const inlineMath = editor.locator('[data-type="inline-math"]');
  const blockMath = editor.locator('[data-type="block-math"]');

  await expect(inlineMath).toHaveCount(1);
  await expect(inlineMath).toHaveAttribute('data-latex', 'x^2+1');
  await expect(blockMath).toHaveCount(1);
  await expect(blockMath).toHaveAttribute('data-latex', '\\int_0^1 x^2\\,\\mathrm{d}x');

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

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+C');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('\\(x^2+1\\)');
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

test('选择题支持可访问分组和原生键盘单选行为', async ({ page }) => {
  const choices = page.getByRole('group', { name: '选择答案' });
  const radios = choices.getByRole('radio');

  await expect(choices).toBeVisible();
  await radios.nth(0).focus();
  await page.keyboard.press('Space');
  await expect(radios.nth(0)).toBeChecked();

  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeFocused();
  await expect(radios.nth(1)).toBeChecked();
});

test('页面通过自动无障碍规则扫描且关键控件具有可访问名称', async ({ page }) => {
  await expect(page.getByRole('toolbar', { name: '公式面板' })).toHaveCount(2);
  await expect(page.getByRole('group', { name: '常用' })).toHaveCount(2);
  await expect(page.getByRole('region', { name: '预览', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '步骤 1' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
