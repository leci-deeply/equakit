import { useEffect, useMemo, useRef } from 'react';

import {
  validateLatexExpression,
  validateMarkdownMath,
  type MathValidationResult,
} from '@math-rich-editor/core';
import { MathFormula } from './MathFormula.js';

export interface FormulaPaletteKey {
  label: string;
  insert: string;
  caretOffset?: number;
  title?: string;
}

export interface FormulaPaletteGroup {
  label: string;
  keys: readonly FormulaPaletteKey[];
}

export interface FormulaInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  palette?: readonly FormulaPaletteGroup[];
  placeholder?: string;
  rows?: number;
  textareaLabel?: string;
  previewLabel?: string;
  hidePreview?: boolean;
  disabled?: boolean;
  validationMode?: 'latex' | 'markdown';
  className?: string;
  onValidationChange?: (result: MathValidationResult | null) => void;
}

export const DEFAULT_FORMULA_PALETTE: readonly FormulaPaletteGroup[] = [
  {
    label: 'Common',
    keys: [
      { label: 'frac', insert: '\\frac{}{}', caretOffset: 6, title: '\\frac{}{}' },
      { label: 'x^n', insert: '^{}', caretOffset: 2 },
      { label: 'x_i', insert: '_{}', caretOffset: 2 },
      { label: 'sqrt', insert: '\\sqrt{}', caretOffset: 6 },
      { label: '()', insert: '\\left(\\right)', caretOffset: 6 },
      { label: '||', insert: '\\left|\\right|', caretOffset: 6 },
    ],
  },
  {
    label: 'Operators',
    keys: [
      { label: 'times', insert: '\\times ' },
      { label: 'div', insert: '\\div ' },
      { label: 'pm', insert: '\\pm ' },
      { label: 'leq', insert: '\\leq ' },
      { label: 'geq', insert: '\\geq ' },
      { label: 'neq', insert: '\\neq ' },
      { label: 'approx', insert: '\\approx ' },
      { label: 'to', insert: '\\to ' },
    ],
  },
  {
    label: 'Calculus',
    keys: [
      { label: 'lim', insert: '\\lim_{}', caretOffset: 6 },
      { label: 'int', insert: '\\int_{}^{}', caretOffset: 6 },
      { label: 'sum', insert: '\\sum_{}^{}', caretOffset: 6 },
      { label: 'prod', insert: '\\prod_{}^{}', caretOffset: 7 },
      { label: 'd', insert: '\\mathrm{d}' },
    ],
  },
  {
    label: 'Greek',
    keys: [
      { label: 'alpha', insert: '\\alpha ' },
      { label: 'beta', insert: '\\beta ' },
      { label: 'gamma', insert: '\\gamma ' },
      { label: 'theta', insert: '\\theta ' },
      { label: 'lambda', insert: '\\lambda ' },
      { label: 'pi', insert: '\\pi ' },
    ],
  },
];

export function insertFormulaSnippet(
  value: string,
  key: FormulaPaletteKey,
  selectionStart: number,
  selectionEnd: number,
): { value: string; caret: number } {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));
  const nextValue = `${value.slice(0, start)}${key.insert}${value.slice(end)}`;
  return {
    value: nextValue,
    caret: start + (key.caretOffset ?? key.insert.length),
  };
}

export function FormulaInput({
  value,
  onChange,
  palette = DEFAULT_FORMULA_PALETTE,
  placeholder = 'Enter LaTeX such as \\frac{1}{2}',
  rows = 3,
  textareaLabel = 'Formula source',
  previewLabel = 'Preview',
  hidePreview = false,
  disabled = false,
  validationMode = 'latex',
  className,
  onValidationChange,
}: FormulaInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const validation = useMemo(
    () =>
      trimmed
        ? validationMode === 'markdown'
          ? validateMarkdownMath(value)
          : validateLatexExpression(value, { display: true })
        : null,
    [trimmed, validationMode, value],
  );

  useEffect(() => {
    onValidationChange?.(validation);
  }, [onValidationChange, validation]);

  function insertKey(key: FormulaPaletteKey) {
    if (disabled) return;
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const next = insertFormulaSnippet(value, key, start, end);
    onChange(next.value);
    globalThis.requestAnimationFrame?.(() => {
      textarea?.focus();
      textarea?.setSelectionRange(next.caret, next.caret);
    });
  }

  return (
    <div className={className ? `mre-formula-input ${className}` : 'mre-formula-input'}>
      <div className="mre-formula-input__palette" role="toolbar" aria-label="Formula palette">
        {palette.map((group) => (
          <div className="mre-formula-input__group" key={group.label} aria-label={group.label}>
            {group.keys.map((key) => (
              <button
                className="mre-formula-input__key"
                disabled={disabled}
                key={`${group.label}:${key.label}:${key.insert}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertKey(key);
                }}
                title={key.title ?? key.insert.trim()}
                type="button"
              >
                {key.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <textarea
        aria-label={textareaLabel}
        className="mre-formula-input__textarea"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        ref={textareaRef}
        rows={rows}
        value={value}
      />
      {!hidePreview && (
        <div aria-label={previewLabel} className="mre-formula-input__preview">
          <span className="mre-formula-input__preview-label">{previewLabel}</span>
          {trimmed ? (
            <MathFormula display expression={value} />
          ) : (
            <span className="mre-formula-input__empty">No formula yet.</span>
          )}
        </div>
      )}
      {validation && !validation.ok && (
        <div className="mre-formula-input__error" role="status">
          {validation.issues[0]?.message ?? 'The formula could not be parsed.'}
        </div>
      )}
    </div>
  );
}
