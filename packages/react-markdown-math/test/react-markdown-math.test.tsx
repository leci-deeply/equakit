import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MarkdownMath, safeUrlTransform } from '../src/index.js';

describe('@equakit/react-markdown-math', () => {
  it('渲染 Markdown 数学内容且不渲染原始 HTML', () => {
    const html = renderToStaticMarkup(
      <MarkdownMath>
        {'你好 $x^2$ <img src=x onerror=alert(1)> [坏链接](javascript:alert(1))'}
      </MarkdownMath>,
    );
    expect(html).toContain('katex');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
  });

  it('过滤不安全 URL 并保留安全 URL', () => {
    expect(safeUrlTransform('javascript:alert(1)')).toBe('');
    expect(safeUrlTransform('//example.com/a', ['mailto:'])).toBe('');
    expect(safeUrlTransform('https://example.com/a')).toBe('https://example.com/a');
    expect(safeUrlTransform('/docs')).toBe('/docs');
    expect(safeUrlTransform('./local')).toBe('./local');
  });

  it('按需启用公式溢出提示且默认不改变根容器模式', () => {
    const enabled = renderToStaticMarkup(
      <MarkdownMath overflowIndicator="hover-scrollbar">{'$x^2$'}</MarkdownMath>,
    );
    const disabled = renderToStaticMarkup(<MarkdownMath>{'$x^2$'}</MarkdownMath>);

    expect(enabled).toContain('mre-markdown-math--overflow-aware');
    expect(disabled).not.toContain('mre-markdown-math--overflow-aware');
  });
});
