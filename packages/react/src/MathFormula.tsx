import katex from 'katex';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { stripMathDelimiters } from '@equakit/core';

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
      return katex.renderToString(normalized, {
        displayMode: display,
        throwOnError: true,
        strict: 'ignore',
        trust: false,
      });
    } catch {
      return null;
    }
  }, [display, normalized]);
  const modeClass = display ? 'mre-math-formula mre-math-formula--display' : 'mre-math-formula';
  const classes = className ? `${modeClass} ${className}` : modeClass;

  if (html == null) {
    return (
      <span className={classes} aria-label={ariaLabel ?? normalized}>
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
    />
  );
}
