import { describe, expect, it } from 'vitest';

import * as core from '../src/index.js';

const legacyRuntimeExports = [
  'CHOICE_LETTERS',
  'KeyedMutationVersion',
  'MATH_CLIPBOARD_MIME_TYPES',
  'StaleResponseGuard',
  'choiceIndicesToLetters',
  'choiceLettersToIndices',
  'choiceLettersToString',
  'createMathClipboardPayload',
  'deletionKeyFromInputType',
  'extractMathTokens',
  'extractSingleLatexExpression',
  'formatStepAnswer',
  'gradeChoiceAnswer',
  'inferMultipleChoice',
  'isCurrentMutation',
  'isFormulaShapedLatexLine',
  'joinEditorLines',
  'mergeStepWithNext',
  'mergeStepWithPrevious',
  'nextMutationVersion',
  'normalizeAnswerLetters',
  'normalizeClipboardText',
  'normalizeLatexExpression',
  'normalizeLooseLatexLine',
  'normalizeMarkdownMath',
  'parseChoiceAnswer',
  'rawTextToEditorLines',
  'richDomToMarkdown',
  'richHtmlToMarkdown',
  'richSelectionToMarkdown',
  'selectionMatchesRange',
  'splitStepAtCursor',
  'stepBoundaryDeletionAction',
  'stepTextToLines',
  'stripMathDelimiters',
  'textToStepAnswer',
  'validateLatexExpression',
  'validateMarkdownMath',
] as const;

describe('@equakit/core 兼容入口', () => {
  it('完整保留重构前的运行时导出', () => {
    expect(Object.keys(core).sort()).toEqual([...legacyRuntimeExports].sort());
  });
});
