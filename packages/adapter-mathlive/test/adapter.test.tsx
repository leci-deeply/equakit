import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { FormulaInput } from '@equakit/react';
import { MathLiveFormulaEditor, createMathLiveFormulaEditor } from '../src/index.js';

describe('@equakit/adapter-mathlive', () => {
  it('服务端渲染时只输出延迟加载宿主，不访问浏览器 API', () => {
    const html = renderToStaticMarkup(
      <FormulaInput editor={MathLiveFormulaEditor} onChange={() => undefined} value="x^2" />,
    );

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
    const html = renderToStaticMarkup(
      <FormulaInput editor={Editor} onChange={() => undefined} value="" />,
    );

    expect(html).toContain('data-equakit-mathlive-host="true"');
  });
});
