import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  MathCopyBoundary,
  createCoreMathClipboardSerializer,
  normalizeClipboardText,
  serializeRenderedMath,
} from '../src/index.js';

describe('@equakit/react-clipboard', () => {
  it('归一化剪贴板文本并适配 core 序列化器', () => {
    expect(normalizeClipboardText('  \\\\frac{1}{2}  ')).toBe('\\(\\\\frac{1}{2}\\)');
    const serializer = createCoreMathClipboardSerializer({
      serializeRenderedMath: () => '来自 core',
    });
    expect(serializer({ root: fakeParentNode() })).toBe('来自 core');
  });

  it('DOM 节点可用时序列化渲染后的数学源码标记', () => {
    if (typeof DOMParser === 'undefined') return;
    const doc = new DOMParser().parseFromString(
      '<p>结果 <span data-math-source="x^2"><span class="katex">x</span></span></p>',
      'text/html',
    );
    expect(serializeRenderedMath({ root: doc.body })).toContain('\\(x^2\\)');
  });

  it('渲染复制边界并保留默认 className', () => {
    const html = renderToStaticMarkup(<MathCopyBoundary>内容</MathCopyBoundary>);
    expect(html).toContain('class="mre-copy-boundary"');
    expect(html).toContain('内容');
  });
});

function fakeParentNode(): ParentNode {
  return { childNodes: [] } as unknown as ParentNode;
}
