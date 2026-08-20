import { useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { defaultKatexRenderer } from '@equakit/katex-engine';
import { stripMathDelimiters } from '@equakit/math-text';

export interface MathFormulaProps {
  expression: string;
  display?: boolean;
  className?: string;
  fallback?: ReactNode;
  ariaLabel?: string;
}

function handleHorizontalScrollKey(event: KeyboardEvent<HTMLSpanElement>) {
  const target = event.currentTarget;
  let nextScrollLeft: number | null = null;

  if (event.key === 'ArrowLeft') nextScrollLeft = target.scrollLeft - 40;
  if (event.key === 'ArrowRight') nextScrollLeft = target.scrollLeft + 40;
  if (event.key === 'Home') nextScrollLeft = 0;
  if (event.key === 'End') nextScrollLeft = target.scrollWidth - target.clientWidth;
  if (nextScrollLeft == null) return;

  const boundedScrollLeft = Math.max(
    0,
    Math.min(nextScrollLeft, target.scrollWidth - target.clientWidth),
  );
  if (boundedScrollLeft === target.scrollLeft) return;
  event.preventDefault();
  target.scrollLeft = boundedScrollLeft;
}

export function MathFormula({
  expression,
  display = false,
  className,
  fallback,
  ariaLabel,
}: MathFormulaProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLSpanElement>(null);
  const normalized = stripMathDelimiters(expression);
  const html = useMemo(() => {
    try {
      const rendered = defaultKatexRenderer(normalized, {
        displayMode: display,
        throwOnError: true,
        strict: 'ignore',
      });
      return typeof rendered === 'string' ? rendered : null;
    } catch {
      return null;
    }
  }, [display, normalized]);
  const modeClass = display ? 'mre-math-formula mre-math-formula--display' : 'mre-math-formula';
  const classes = className ? `${modeClass} ${className}` : modeClass;

  const content =
    html == null ? (fallback ?? normalized) : <span dangerouslySetInnerHTML={{ __html: html }} />;

  useEffect(() => {
    const target = display ? scrollRef.current : rootRef.current;
    if (target == null) return undefined;

    let disposed = false;
    let frame: number | null = null;

    const syncOverflow = () => {
      const overflowing = target.scrollWidth > target.clientWidth + 1;
      target.classList.toggle('mre-math-overflowing', overflowing);
      if (overflowing && !target.hasAttribute('tabindex')) {
        target.tabIndex = 0;
        target.dataset.mreOverflowTabIndex = 'true';
      } else if (!overflowing && target.dataset.mreOverflowTabIndex === 'true') {
        target.removeAttribute('tabindex');
        delete target.dataset.mreOverflowTabIndex;
      }
    };

    const scheduleOverflowSync = () => {
      if (disposed || frame != null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (!disposed) syncOverflow();
      });
    };

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleOverflowSync);
    resizeObserver?.observe(target);
    const listensForWindowResize = resizeObserver == null;
    if (listensForWindowResize) window.addEventListener('resize', scheduleOverflowSync);

    const fontSet = typeof document.fonts === 'undefined' ? null : document.fonts;
    const listensForFontLoads = fontSet != null && typeof fontSet.addEventListener === 'function';
    if (fontSet?.ready != null) void fontSet.ready.then(scheduleOverflowSync);
    if (listensForFontLoads) fontSet.addEventListener('loadingdone', scheduleOverflowSync);
    scheduleOverflowSync();

    return () => {
      disposed = true;
      if (frame != null) window.cancelAnimationFrame(frame);
      if (listensForWindowResize) window.removeEventListener('resize', scheduleOverflowSync);
      if (listensForFontLoads) fontSet.removeEventListener('loadingdone', scheduleOverflowSync);
      resizeObserver?.disconnect();
      target.classList.remove('mre-math-overflowing');
      if (target.dataset.mreOverflowTabIndex === 'true') {
        target.removeAttribute('tabindex');
        delete target.dataset.mreOverflowTabIndex;
      }
    };
  }, [display, normalized]);

  return (
    <span
      ref={rootRef}
      className={classes}
      data-math-source={html == null ? undefined : normalized}
      aria-label={ariaLabel ?? normalized}
      onKeyDown={display ? undefined : handleHorizontalScrollKey}
      role="math"
    >
      {display ? (
        <span
          className="mre-math-formula__scroll"
          onKeyDown={handleHorizontalScrollKey}
          ref={scrollRef}
        >
          {content}
        </span>
      ) : (
        content
      )}
    </span>
  );
}
