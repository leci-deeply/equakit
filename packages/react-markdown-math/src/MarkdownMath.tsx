import Markdown, { defaultUrlTransform } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import { normalizeMarkdownMath } from '@equakit/math-text';

export type FormulaOverflowIndicator = 'none' | 'hover-scrollbar';

export interface MarkdownMathProps {
  children: string;
  className?: string;
  allowedUrlProtocols?: readonly string[];
  overflowIndicator?: FormulaOverflowIndicator;
}

const DEFAULT_ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'] as const;

function handleFormulaScrollKey(event: KeyboardEvent<HTMLDivElement>) {
  if (!(event.target instanceof Element)) return;
  const formula = event.target.closest('.katex.mre-math-overflowing');
  if (!(formula instanceof HTMLElement) || !event.currentTarget.contains(formula)) return;

  let nextScrollLeft: number | null = null;
  if (event.key === 'ArrowLeft') nextScrollLeft = formula.scrollLeft - 40;
  if (event.key === 'ArrowRight') nextScrollLeft = formula.scrollLeft + 40;
  if (event.key === 'Home') nextScrollLeft = 0;
  if (event.key === 'End') nextScrollLeft = formula.scrollWidth - formula.clientWidth;
  if (nextScrollLeft == null) return;

  const boundedScrollLeft = Math.max(
    0,
    Math.min(nextScrollLeft, formula.scrollWidth - formula.clientWidth),
  );
  if (boundedScrollLeft === formula.scrollLeft) return;
  event.preventDefault();
  formula.scrollLeft = boundedScrollLeft;
}

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
  overflowIndicator = 'none',
}: MarkdownMathProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scheduleOverflowSyncRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const root = rootRef.current;
    if (root == null) return undefined;

    const observed = new Set<HTMLElement>();
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;
    let frame: number | null = null;

    const syncFormulaOverflow = () => {
      const formulas = new Set(root.querySelectorAll<HTMLElement>('.katex'));

      for (const formula of observed) {
        if (formulas.has(formula)) continue;
        resizeObserver?.unobserve(formula);
        observed.delete(formula);
        formula.classList.remove('mre-math-overflowing');
        if (formula.dataset.mreOverflowTabIndex === 'true') {
          formula.removeAttribute('tabindex');
          delete formula.dataset.mreOverflowTabIndex;
        }
      }

      for (const formula of formulas) {
        const overflowing = formula.scrollWidth > formula.clientWidth + 1;
        formula.classList.toggle('mre-math-overflowing', overflowing);
        if (overflowing && !formula.hasAttribute('tabindex')) {
          formula.tabIndex = 0;
          formula.dataset.mreOverflowTabIndex = 'true';
        } else if (!overflowing && formula.dataset.mreOverflowTabIndex === 'true') {
          formula.removeAttribute('tabindex');
          delete formula.dataset.mreOverflowTabIndex;
        }
        if (resizeObserver != null && !observed.has(formula)) {
          observed.add(formula);
          resizeObserver.observe(formula);
        }
      }
    };

    const scheduleFormulaOverflowSync = () => {
      if (disposed || frame != null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (!disposed) syncFormulaOverflow();
      });
    };
    scheduleOverflowSyncRef.current = scheduleFormulaOverflowSync;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleFormulaOverflowSync);
      resizeObserver.observe(root);
    }
    const listensForWindowResize = resizeObserver == null;
    if (listensForWindowResize) window.addEventListener('resize', scheduleFormulaOverflowSync);

    const fontSet = typeof document.fonts === 'undefined' ? null : document.fonts;
    const listensForFontLoads = fontSet != null && typeof fontSet.addEventListener === 'function';
    if (fontSet?.ready != null) void fontSet.ready.then(scheduleFormulaOverflowSync);
    if (listensForFontLoads) {
      fontSet.addEventListener('loadingdone', scheduleFormulaOverflowSync);
    }
    scheduleFormulaOverflowSync();

    return () => {
      disposed = true;
      scheduleOverflowSyncRef.current = () => undefined;
      if (frame != null) window.cancelAnimationFrame(frame);
      if (listensForWindowResize) {
        window.removeEventListener('resize', scheduleFormulaOverflowSync);
      }
      if (listensForFontLoads) {
        fontSet.removeEventListener('loadingdone', scheduleFormulaOverflowSync);
      }
      resizeObserver?.disconnect();
      root.querySelectorAll('.mre-math-overflowing').forEach((formula) => {
        formula.classList.remove('mre-math-overflowing');
        if (formula instanceof HTMLElement && formula.dataset.mreOverflowTabIndex === 'true') {
          formula.removeAttribute('tabindex');
          delete formula.dataset.mreOverflowTabIndex;
        }
      });
    };
  }, []);

  useEffect(() => {
    scheduleOverflowSyncRef.current();
  }, [children]);

  const rootClassName = [
    'mre-markdown-math',
    overflowIndicator === 'hover-scrollbar' ? 'mre-markdown-math--overflow-aware' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName} onKeyDown={handleFormulaScrollKey} ref={rootRef}>
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
