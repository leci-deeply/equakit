import { describe, expect, it } from 'vitest';

import {
  extractMathTokens,
  normalizeLatexExpression,
  normalizeMarkdownMath,
  stripMathDelimiters,
  validateLatexExpression,
  validateMarkdownMath,
} from '../src';

describe('数学工具', () => {
  it('移除嵌套数学分隔符且不改动表达式主体', () => {
    expect(stripMathDelimiters('  \\( $$ x + 1 $$ \\)  ')).toBe('x + 1');
  });

  it('归一化常见 Markdown 和 LaTeX 数学分隔符', () => {
    const normalized = normalizeMarkdownMath('面积 \\(a^2\\)\n\\[\\frac{1}{2}\\]');

    expect(normalized).toContain('面积 $a^2$');
    expect(normalized).toContain('$$\n\\frac{1}{2}\n$$');
  });

  it('将独立的 LaTeX 命令行包裹为展示数学公式', () => {
    expect(normalizeMarkdownMath('\\frac{1}{2} + \\sqrt{x}')).toBe(
      '$$\n\\frac{1}{2} + \\sqrt{x}\n$$',
    );
  });

  it('不会自动包裹 CJK 正文行', () => {
    expect(normalizeMarkdownMath('由 \\frac{1}{2} 可知')).toBe('由 \\frac{1}{2} 可知');
  });

  it('不会自动包裹包含 LaTeX 命令的英文正文', () => {
    const prose = String.raw`Area is \frac{1}{2} of the total.`;
    expect(normalizeMarkdownMath(prose)).toBe(prose);
    expect(normalizeMarkdownMath(String.raw`x = \frac{1}{2}`)).toContain('$$');
  });

  it('幂等地为类极限运算符补充 limits', () => {
    expect(normalizeLatexExpression('\\lim_{x\\to0} x')).toBe('\\lim\\limits_{x\\to0} x');
    expect(normalizeLatexExpression('\\lim\\limits_{x\\to0} x')).toBe('\\lim\\limits_{x\\to0} x');
  });

  it('提取行内和展示数学 token 及其范围', () => {
    expect(extractMathTokens('甲 $x$ 乙 $$ y $$')).toMatchObject([
      { expression: 'x', display: false, delimiter: '$' },
      { expression: 'y', display: true, delimiter: '$$' },
    ]);
  });

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
});
