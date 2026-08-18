import { describe, expect, it } from 'vitest';

import { createMathLiveClipboardConverter, mathLiveClipboardConverter } from '../src/index.js';

describe('@equakit/mathlive-formats', () => {
  it('把 LaTeX 转换为完整 MathML、AsciiMath 和 raw MathJSON', () => {
    expect(mathLiveClipboardConverter.toAsciiMath?.('\\frac{1}{2}')).toBe('(1)/(2)');
    expect(mathLiveClipboardConverter.toMathJSON?.('\\frac{1}{2}')).toEqual(['Divide', 1, 2]);
    expect(mathLiveClipboardConverter.toMathML?.('x^2+1')).toMatch(
      /^<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"><mrow>/,
    );
  });

  it('允许选择 canonical MathJSON', () => {
    const converter = createMathLiveClipboardConverter({ canonicalMathJSON: true });

    expect(converter.toMathJSON?.('\\frac{1}{2}')).toEqual(['Rational', 1, 2]);
  });

  it('保留 MathClipboardFormatConverter 的可选方法契约', () => {
    const converter = createMathLiveClipboardConverter();

    expect(typeof converter.toMathML).toBe('function');
    expect(typeof converter.toAsciiMath).toBe('function');
    expect(typeof converter.toMathJSON).toBe('function');
  });
});
