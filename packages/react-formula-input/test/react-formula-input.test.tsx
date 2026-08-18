import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FormulaInput, insertFormulaSnippet } from '../src/index.js';

describe('@equakit/react-formula-input', () => {
  it('按光标偏移插入公式片段', () => {
    expect(
      insertFormulaSnippet('ab', { label: 'frac', insert: '\\frac{}{}', caretOffset: 6 }, 1, 1),
    ).toEqual({
      value: 'a\\frac{}{}b',
      caret: 7,
    });
  });

  it('使用自定义面板渲染 FormulaInput', () => {
    const html = renderToStaticMarkup(
      <FormulaInput
        hidePreview
        onChange={() => undefined}
        palette={[{ label: '集合', keys: [{ label: '并集', insert: '\\cup ' }] }]}
        value=""
      />,
    );
    expect(html).toContain('公式面板');
    expect(html).toContain('并集');
    expect(html).toContain('aria-label="公式源码"');
  });

  it('显示校验错误并保留可访问状态', () => {
    const html = renderToStaticMarkup(<FormulaInput onChange={() => undefined} value="\\frac{1" />);
    expect(html).toContain('预览');
    expect(html).toContain('mre-formula-input__error');
    expect(html).toContain('role="status"');
  });
});
