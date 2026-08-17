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
    label: '常用',
    keys: [
      { label: '分式', insert: '\\frac{}{}', caretOffset: 6, title: '\\frac{}{}' },
      { label: 'x^n', insert: '^{}', caretOffset: 2 },
      { label: 'x_i', insert: '_{}', caretOffset: 2 },
      { label: '根式', insert: '\\sqrt{}', caretOffset: 6 },
      { label: '()', insert: '\\left(\\right)', caretOffset: 6 },
      { label: '||', insert: '\\left|\\right|', caretOffset: 6 },
    ],
  },
  {
    label: '运算符',
    keys: [
      { label: '乘', insert: '\\times ' },
      { label: '除', insert: '\\div ' },
      { label: '正负', insert: '\\pm ' },
      { label: '小于等于', insert: '\\leq ' },
      { label: '大于等于', insert: '\\geq ' },
      { label: '不等于', insert: '\\neq ' },
      { label: '约等于', insert: '\\approx ' },
      { label: '趋于', insert: '\\to ' },
    ],
  },
  {
    label: '微积分',
    keys: [
      { label: '极限', insert: '\\lim_{}', caretOffset: 6 },
      { label: '积分', insert: '\\int_{}^{}', caretOffset: 6 },
      { label: '求和', insert: '\\sum_{}^{}', caretOffset: 6 },
      { label: '连乘', insert: '\\prod_{}^{}', caretOffset: 7 },
      { label: '微分', insert: '\\mathrm{d}' },
    ],
  },
  {
    label: '希腊字母',
    keys: [
      { label: 'α', insert: '\\alpha ' },
      { label: 'β', insert: '\\beta ' },
      { label: 'γ', insert: '\\gamma ' },
      { label: 'θ', insert: '\\theta ' },
      { label: 'λ', insert: '\\lambda ' },
      { label: 'π', insert: '\\pi ' },
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
  placeholder = '输入 LaTeX，例如 \\frac{1}{2}',
  rows = 3,
  textareaLabel = '公式源码',
  previewLabel = '预览',
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
      <div className="mre-formula-input__palette" role="toolbar" aria-label="公式面板">
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
            <span className="mre-formula-input__empty">暂无公式。</span>
          )}
        </div>
      )}
      {validation && !validation.ok && (
        <div className="mre-formula-input__error" role="status">
          {validation.issues[0]?.message ?? '无法解析该公式。'}
        </div>
      )}
    </div>
  );
}
