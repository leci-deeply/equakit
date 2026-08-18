import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MathFormula } from '../src/index.js';

describe('@equakit/react-katex', () => {
  it('安全渲染 KaTeX 并保留可供复制适配器读取的源码表达式', () => {
    const html = renderToStaticMarkup(<MathFormula expression={'\\frac{1}{2}'} />);
    expect(html).toContain('katex');
    expect(html).toContain('mfrac');
    expect(html).toContain('role="math"');
    expect(html).toMatch(/data-math-source="\\+frac\{1\}\{2\}"/);
  });

  it('KaTeX 拒绝表达式时回退显示源码文本', () => {
    const html = renderToStaticMarkup(<MathFormula expression={'\\frac{1'} />);
    expect(html).toContain('\\frac{1');
    expect(html).not.toContain('katex-error');
  });

  it('去除外层数学分隔符并保留自定义 className', () => {
    const html = renderToStaticMarkup(
      <MathFormula className="custom" display expression={'\\[x^2\\]'} />,
    );
    expect(html).toContain('mre-math-formula--display');
    expect(html).toContain('custom');
    expect(html).toMatch(/data-math-source="x\^2"/);
  });
});
