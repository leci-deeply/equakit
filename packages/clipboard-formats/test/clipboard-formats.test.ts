import { describe, expect, it } from 'vitest';

import {
  MATH_CLIPBOARD_MIME_TYPES,
  createMathClipboardPayload,
  extractSingleLatexExpression,
} from '../src/index.js';

describe('多格式数学剪贴板', () => {
  it('从单个行内或块级公式提取 LaTeX', () => {
    expect(extractSingleLatexExpression('\\(\\frac{1}{2}\\)')).toBe('\\frac{1}{2}');
    expect(extractSingleLatexExpression('\\[x^2+1\\]')).toBe('x^2+1');
    expect(extractSingleLatexExpression('正文 \\(x^2\\)')).toBeNull();
    expect(extractSingleLatexExpression('\\(x\\) 和 \\(y\\)')).toBeNull();
  });

  it('为单公式创建五种 MIME 数据', () => {
    const payload = createMathClipboardPayload('\\(\\frac{1}{2}\\)', {
      toAsciiMath: () => '1/2',
      toMathJSON: () => ['Rational', 1, 2],
      toMathML: () => '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>',
    });

    expect(payload).toEqual({
      [MATH_CLIPBOARD_MIME_TYPES.plainText]: '\\(\\frac{1}{2}\\)',
      [MATH_CLIPBOARD_MIME_TYPES.latex]: '\\frac{1}{2}',
      [MATH_CLIPBOARD_MIME_TYPES.mathml]: '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>',
      [MATH_CLIPBOARD_MIME_TYPES.asciimath]: '1/2',
      [MATH_CLIPBOARD_MIME_TYPES.mathjson]: '["Rational",1,2]',
    });
  });

  it('混合正文只输出 text/plain', () => {
    expect(createMathClipboardPayload('面积为 \\(a^2\\)。', { toAsciiMath: () => 'a^2' })).toEqual({
      [MATH_CLIPBOARD_MIME_TYPES.plainText]: '面积为 \\(a^2\\)。',
    });
  });

  it('单个转换器失败不会阻断其他格式', () => {
    const payload = createMathClipboardPayload('\\(x^2\\)', {
      toAsciiMath: () => 'x^2',
      toMathJSON: () => {
        throw new Error('转换失败');
      },
      toMathML: () => {
        throw new Error('转换失败');
      },
    });

    expect(payload).toEqual({
      [MATH_CLIPBOARD_MIME_TYPES.plainText]: '\\(x^2\\)',
      [MATH_CLIPBOARD_MIME_TYPES.latex]: 'x^2',
      [MATH_CLIPBOARD_MIME_TYPES.asciimath]: 'x^2',
    });
  });
});
