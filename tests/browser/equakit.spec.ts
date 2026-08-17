import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('把浏览器选区中的渲染公式复制为可编辑 LaTeX', async ({ page }) => {
  const boundary = page.locator('.mre-copy-boundary');
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

test('公式面板在当前选区插入片段并把光标放进占位符', async ({ page }) => {
  const textarea = page.getByRole('textbox', { name: '公式源码' });
  await textarea.fill('ab');
  await textarea.evaluate((element) => {
    element.setSelectionRange(1, 1);
  });

  await page.getByRole('button', { name: '分式', exact: true }).click();

  await expect(textarea).toHaveValue('a\\frac{}{}b');
  await expect(textarea).toHaveJSProperty('selectionStart', 7);
  await expect(textarea).toHaveJSProperty('selectionEnd', 7);

  await textarea.pressSequentially('1');
  await expect(textarea).toHaveValue('a\\frac{1}{}b');
});

test('Chromium IME composition 期间保持受控输入值并正常提交中文', async ({ page }) => {
  const textarea = page.getByRole('textbox', { name: '公式源码' });
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
  await expect(page.getByRole('toolbar', { name: '公式面板' })).toBeVisible();
  await expect(page.getByRole('group', { name: '常用' })).toBeVisible();
  await expect(page.getByRole('region', { name: '预览' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '步骤 1' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
