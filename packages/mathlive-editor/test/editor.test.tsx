import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { MathLiveFormulaEditor, createMathLiveFormulaEditor } from '../src/index.js';

describe('@equakit/mathlive-editor', () => {
  const requiredProps = {
    ariaLabel: '数学公式',
    className: 'mre-formula-input__textarea',
    disabled: false,
    onChange: () => undefined,
    placeholder: '输入 LaTeX',
    rows: 3,
    value: 'x^2',
  };

  it('服务端渲染时只输出延迟加载宿主，不访问浏览器 API', () => {
    const html = renderToStaticMarkup(<MathLiveFormulaEditor {...requiredProps} />);

    expect(html).toContain('data-equakit-mathlive-host="true"');
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('<math-field');
  });

  it('可以创建带独立配置的 MathLive 编辑器 adapter', () => {
    const Editor = createMathLiveFormulaEditor({
      popoverPolicy: 'off',
      smartFence: false,
      virtualKeyboardPolicy: 'manual',
    });
    const html = renderToStaticMarkup(<Editor {...requiredProps} value="" />);

    expect(html).toContain('data-equakit-mathlive-host="true"');
  });
});
