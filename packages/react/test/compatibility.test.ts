import { describe, expect, it } from 'vitest';

import * as react from '../src/index.js';

const legacyRuntimeExports = [
  'AnswerStepsEditor',
  'DEFAULT_FORMULA_PALETTE',
  'FormulaInput',
  'InteractiveChoices',
  'MATH_CLIPBOARD_MIME_TYPES',
  'MarkdownMath',
  'MathCopyBoundary',
  'MathFormula',
  'createCoreMathClipboardSerializer',
  'createMathClipboardPayload',
  'extractMathTokens',
  'getStepBoundaryAction',
  'insertFormulaSnippet',
  'mergeStepAtBoundary',
  'normalizeClipboardText',
  'normalizeLatexExpression',
  'normalizeMarkdownMath',
  'safeUrlTransform',
  'serializeRenderedMath',
  'stripMathDelimiters',
  'useMathClipboard',
  'validateLatexExpression',
  'validateMarkdownMath',
] as const;

describe('@equakit/react 兼容入口', () => {
  it('完整保留重构前的运行时导出', () => {
    expect(Object.keys(react).sort()).toEqual([...legacyRuntimeExports].sort());
  });
});
