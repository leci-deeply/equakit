import { describe, expect, it } from 'vitest';

import {
  renderLatexToString,
  validateLatexExpression,
  validateMarkdownMath,
} from '../src/index.js';

describe('KaTeX 数学校验引擎', () => {
  it('校验合法 KaTeX 并报告非法表达式', () => {
    expect(validateLatexExpression('\\frac{1}{2}').ok).toBe(true);

    const invalid = validateLatexExpression('\\frac{1');
    expect(invalid.ok).toBe(false);
    expect(invalid.issues[0]?.kind).toBe('latex');
  });

  it('报告不成对的 Markdown 分隔符', () => {
    const result = validateMarkdownMath('价格是 $x + 1');

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.kind === 'delimiter')).toBe(true);
  });

  it('支持注入 renderer 契约', () => {
    const calls: Array<{ expression: string; displayMode: boolean }> = [];
    const result = validateMarkdownMath('甲 $x$ 乙 $$ y $$', {
      renderToString: (expression, options) => {
        calls.push({ expression, displayMode: options.displayMode });
      },
    });

    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      { expression: 'x', displayMode: false },
      { expression: 'y', displayMode: true },
    ]);
  });

  it('安全渲染接口始终关闭 KaTeX trust', () => {
    expect(renderLatexToString('x + 1')).toContain('katex');
    expect(
      renderLatexToString(String.raw`\htmlClass{danger}{x}`, { strict: 'ignore' }),
    ).not.toContain('class="danger"');
  });
});
