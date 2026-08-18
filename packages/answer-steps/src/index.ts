export interface StepAnswer {
  steps: string[];
  finalAnswer?: string;
}

export type StepBoundaryDeletionKey = 'Backspace' | 'Delete';
export type StepBoundaryDeletionAction = 'none' | 'arm' | 'hold' | 'merge';

export interface StepBoundaryDeletionInput {
  key: string;
  selectionCollapsed: boolean;
  atStepBoundary: boolean;
  targetAlreadyArmed: boolean;
  repeat?: boolean;
}

const NUMBERED_STEP_PREFIX = /^\s*\d+[.、)]\s*/;
const LETTERED_STEP_PREFIX = /^\s*[a-zA-Z][.、)]\s*/;
const MARKDOWN_BULLET_PREFIX = /^\s*[-*+]\s+/;

export function formatStepAnswer(answer: StepAnswer, options: { numbered?: boolean } = {}): string {
  const numbered = options.numbered ?? true;
  return answer.steps
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step, index) => (numbered ? `${index + 1}. ${step}` : step))
    .join('\n');
}

export function textToStepAnswer(text: string): StepAnswer {
  return {
    steps: stepTextToLines(text),
  };
}

export function stepTextToLines(text: string): string[] {
  const lines = nonEmptyTrimmedLines(text).map(stripStepPrefix);
  return lines.length ? lines : [''];
}

export function rawTextToEditorLines(text: string): string[] {
  const lines = nonEmptyTrimmedLines(text);
  return lines.length ? lines : [''];
}

export function joinEditorLines(lines: readonly string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function splitStepAtCursor(
  steps: readonly string[],
  stepIndex: number,
  cursorOffset: number,
): string[] {
  const next = [...steps];
  const current = next[stepIndex] ?? '';
  const offset = clamp(cursorOffset, 0, current.length);
  next.splice(stepIndex, 1, current.slice(0, offset), current.slice(offset));
  return ensureAtLeastOneLine(next);
}

export function mergeStepWithPrevious(steps: readonly string[], stepIndex: number): string[] {
  if (stepIndex <= 0 || stepIndex >= steps.length) return ensureAtLeastOneLine(steps);

  const next = [...steps];
  const previous = next[stepIndex - 1] ?? '';
  const current = next[stepIndex] ?? '';
  next.splice(stepIndex - 1, 2, mergeStepText(previous, current));
  return ensureAtLeastOneLine(next);
}

export function mergeStepWithNext(steps: readonly string[], stepIndex: number): string[] {
  if (stepIndex < 0 || stepIndex >= steps.length - 1) return ensureAtLeastOneLine(steps);

  const next = [...steps];
  const current = next[stepIndex] ?? '';
  const following = next[stepIndex + 1] ?? '';
  next.splice(stepIndex, 2, mergeStepText(current, following));
  return ensureAtLeastOneLine(next);
}

export function deletionKeyFromInputType(inputType: string): StepBoundaryDeletionKey | null {
  if (inputType === 'deleteContentBackward') return 'Backspace';
  if (inputType === 'deleteContentForward') return 'Delete';
  return null;
}

export function stepBoundaryDeletionAction({
  key,
  selectionCollapsed,
  atStepBoundary,
  targetAlreadyArmed,
  repeat = false,
}: StepBoundaryDeletionInput): StepBoundaryDeletionAction {
  if (!selectionCollapsed || !atStepBoundary) return 'none';
  if (key !== 'Backspace' && key !== 'Delete') return 'none';
  if (repeat && targetAlreadyArmed) return 'hold';
  return targetAlreadyArmed ? 'merge' : 'arm';
}

export function selectionMatchesRange(
  selection: Selection | null,
  armedRange: Range | null,
): boolean {
  if (!selection || !armedRange || selection.rangeCount !== 1) return false;
  const currentRange = selection.getRangeAt(0);
  return (
    currentRange.startContainer === armedRange.startContainer &&
    currentRange.startOffset === armedRange.startOffset &&
    currentRange.endContainer === armedRange.endContainer &&
    currentRange.endOffset === armedRange.endOffset
  );
}

function nonEmptyTrimmedLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripStepPrefix(line: string): string {
  return line
    .replace(MARKDOWN_BULLET_PREFIX, '')
    .replace(NUMBERED_STEP_PREFIX, '')
    .replace(LETTERED_STEP_PREFIX, '')
    .trim();
}

function ensureAtLeastOneLine(lines: readonly string[]): string[] {
  const next = [...lines];
  return next.length ? next : [''];
}

function mergeStepText(left: string, right: string): string {
  const lhs = left.trimEnd();
  const rhs = right.trimStart();
  if (!lhs) return rhs;
  if (!rhs) return lhs;
  return `${lhs}\n${rhs}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
