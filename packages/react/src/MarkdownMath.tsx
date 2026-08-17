import Markdown, { defaultUrlTransform } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { normalizeMarkdownMath } from '@equakit/core';

export interface MarkdownMathProps {
  children: string;
  className?: string;
  allowedUrlProtocols?: readonly string[];
}

const DEFAULT_ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'] as const;

export function safeUrlTransform(
  url: string,
  allowedProtocols: readonly string[] = DEFAULT_ALLOWED_PROTOCOLS,
): string {
  const transformed = defaultUrlTransform(url);
  if (!transformed) return '';
  if (
    transformed.startsWith('#') ||
    (transformed.startsWith('/') && !transformed.startsWith('//')) ||
    transformed.startsWith('./')
  ) {
    return transformed;
  }

  try {
    const parsed = new URL(transformed, 'https://example.invalid');
    if (parsed.origin === 'https://example.invalid' && !transformed.includes(':')) {
      return transformed;
    }
    return allowedProtocols.includes(parsed.protocol) ? transformed : '';
  } catch {
    return '';
  }
}

export function MarkdownMath({
  children,
  className,
  allowedUrlProtocols = DEFAULT_ALLOWED_PROTOCOLS,
}: MarkdownMathProps) {
  return (
    <div className={className ? `mre-markdown-math ${className}` : 'mre-markdown-math'}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={(url) => safeUrlTransform(url, allowedUrlProtocols)}
      >
        {normalizeMarkdownMath(children)}
      </Markdown>
    </div>
  );
}
