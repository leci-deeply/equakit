export {
  deletionKeyFromInputType,
  formatStepAnswer,
  joinEditorLines,
  mergeStepWithNext,
  mergeStepWithPrevious,
  rawTextToEditorLines,
  selectionMatchesRange,
  splitStepAtCursor,
  stepBoundaryDeletionAction,
  stepTextToLines,
  textToStepAnswer,
} from '@equakit/answer-steps';
export type {
  StepAnswer,
  StepBoundaryDeletionAction,
  StepBoundaryDeletionInput,
  StepBoundaryDeletionKey,
} from '@equakit/answer-steps';
export {
  isCurrentMutation,
  KeyedMutationVersion,
  nextMutationVersion,
  StaleResponseGuard,
} from '@equakit/async-guard';
export type { MutationSnapshot, StaleGuardOptions } from '@equakit/async-guard';
export {
  CHOICE_LETTERS,
  choiceIndicesToLetters,
  choiceLettersToIndices,
  choiceLettersToString,
  gradeChoiceAnswer,
  inferMultipleChoice,
  normalizeAnswerLetters,
  parseChoiceAnswer,
} from '@equakit/choice';
export type { ChoiceGradeResult, ChoiceLetter } from '@equakit/choice';
export {
  createMathClipboardPayload,
  extractSingleLatexExpression,
  MATH_CLIPBOARD_MIME_TYPES,
} from '@equakit/clipboard-formats';
export type {
  MathClipboardFormatConverter,
  MathClipboardPayload,
} from '@equakit/clipboard-formats';
export {
  normalizeClipboardText,
  normalizeLooseLatexLine,
  richDomToMarkdown,
  richHtmlToMarkdown,
  richSelectionToMarkdown,
} from '@equakit/clipboard-restore';
export type { RichClipboardOptions } from '@equakit/clipboard-restore';
export { validateLatexExpression, validateMarkdownMath } from '@equakit/katex-engine';
export type {
  LatexRenderer,
  MathValidationIssue,
  MathValidationResult,
} from '@equakit/katex-engine';
export {
  extractMathTokens,
  isFormulaShapedLatexLine,
  normalizeLatexExpression,
  normalizeMarkdownMath,
  stripMathDelimiters,
} from '@equakit/math-text';
export type { MathDelimiter, MathToken } from '@equakit/math-text';
