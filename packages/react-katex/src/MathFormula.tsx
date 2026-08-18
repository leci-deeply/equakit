import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { defaultKatexRenderer } from '@equakit/katex-engine';
import { stripMathDelimiters } from '@equakit/math-text';

export interface MathFormulaProps {
  expression: string;
  display?: boolean;
  className?: string;
  fallback?: ReactNode;
  ariaLabel?: string;
}

export function MathFormula({
  expression,
  display = false,
  className,
  fallback,
  ariaLabel,
}: MathFormulaProps) {
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

  if (html == null) {
    return (
      <span aria-label={ariaLabel ?? normalized} className={classes} role="math">
        {fallback ?? normalized}
      </span>
    );
  }

  return (
    <span
      className={classes}
      data-math-source={normalized}
      aria-label={ariaLabel ?? normalized}
      dangerouslySetInnerHTML={{ __html: html }}
      role="math"
    />
  );
}
