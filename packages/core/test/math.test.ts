import { describe, expect, it } from 'vitest';

import {
  extractMathTokens,
  normalizeLatexExpression,
  normalizeMarkdownMath,
  stripMathDelimiters,
  validateLatexExpression,
  validateMarkdownMath,
} from '../src';

describe('math utilities', () => {
  it('strips nested math delimiters without touching the expression body', () => {
    expect(stripMathDelimiters('  \\( $$ x + 1 $$ \\)  ')).toBe('x + 1');
  });

  it('normalizes common Markdown and LaTeX math delimiters', () => {
    const normalized = normalizeMarkdownMath('Area \\(a^2\\)\n\\[\\frac{1}{2}\\]');

    expect(normalized).toContain('Area $a^2$');
    expect(normalized).toContain('$$\n\\frac{1}{2}\n$$');
  });

  it('wraps standalone LaTeX command lines as display math', () => {
    expect(normalizeMarkdownMath('\\frac{1}{2} + \\sqrt{x}')).toBe(
      '$$\n\\frac{1}{2} + \\sqrt{x}\n$$',
    );
  });

  it('keeps CJK prose lines outside automatic math wrapping', () => {
    expect(normalizeMarkdownMath('由 \\frac{1}{2} 可知')).toBe('由 \\frac{1}{2} 可知');
  });

  it('keeps English prose with a LaTeX command outside automatic math wrapping', () => {
    const prose = String.raw`Area is \frac{1}{2} of the total.`;
    expect(normalizeMarkdownMath(prose)).toBe(prose);
    expect(normalizeMarkdownMath(String.raw`x = \frac{1}{2}`)).toContain('$$');
  });

  it('injects limits into limit-like operators idempotently', () => {
    expect(normalizeLatexExpression('\\lim_{x\\to0} x')).toBe('\\lim\\limits_{x\\to0} x');
    expect(normalizeLatexExpression('\\lim\\limits_{x\\to0} x')).toBe('\\lim\\limits_{x\\to0} x');
  });

  it('extracts inline and display math tokens with ranges', () => {
    expect(extractMathTokens('A $x$ B $$ y $$')).toMatchObject([
      { expression: 'x', display: false, delimiter: '$' },
      { expression: 'y', display: true, delimiter: '$$' },
    ]);
  });

  it('validates valid KaTeX and reports invalid expressions', () => {
    expect(validateLatexExpression('\\frac{1}{2}').ok).toBe(true);

    const invalid = validateLatexExpression('\\frac{1');
    expect(invalid.ok).toBe(false);
    expect(invalid.issues[0]?.kind).toBe('latex');
  });

  it('reports unbalanced Markdown delimiters', () => {
    const result = validateMarkdownMath('Price is $x + 1');

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.kind === 'delimiter')).toBe(true);
  });
});
