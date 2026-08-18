export const CHOICE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export type ChoiceLetter = (typeof CHOICE_LETTERS)[number];

export interface ChoiceGradeResult {
  correct: boolean;
  expected: ChoiceLetter[];
  selected: ChoiceLetter[];
  missing: ChoiceLetter[];
  extra: ChoiceLetter[];
  multi: boolean;
}

const OPTION_DECORATION = /[（）()，,、\s]+/g;
const OPTION_LETTERS_ONLY = /^[A-Ha-h]+$/;
const NEGATIVE_ANSWER_HINT = /不选|非|不是|except|not/i;

export function normalizeAnswerLetters(
  answer: string | null | undefined,
): Set<ChoiceLetter> | null {
  if (answer == null) return null;

  const text = answer.normalize('NFKC').trim();
  const stripped = text.startsWith('选') ? text.slice(1) : text;
  const bare = stripped.replace(OPTION_DECORATION, '');

  if (bare && OPTION_LETTERS_ONLY.test(bare)) return toChoiceLetterSet(bare);
  return null;
}

export function parseChoiceAnswer(answer: string | null | undefined): Set<ChoiceLetter> | null {
  const strict = normalizeAnswerLetters(answer);
  if (strict) return strict;
  if (answer == null) return null;

  const text = answer.normalize('NFKC').trim();
  if (!text || NEGATIVE_ANSWER_HINT.test(text)) return null;

  const plain = text
    .replace(/\$+/g, '')
    .replace(/\\(?:mathrm|text|operatorname)\{([A-Ha-h、,，\s]+)\}/g, '$1')
    .replace(/[【】[\]{}]/g, '')
    .trim();

  const phraseMatch = plain.match(
    /(?:答案|正确答案|故选|应选|选项|选|answer|answers?)\s*(?:是|为|:|：|=)?\s*([A-Ha-h](?:[（）()，,、\s]*[A-Ha-h])*)/i,
  );
  if (phraseMatch?.[1]) return normalizeAnswerLetters(phraseMatch[1]);

  const bracketMatches = [...plain.matchAll(/[（(]\s*([A-Ha-h])\s*[）)]/g)]
    .map((match) => match[1])
    .filter(isChoiceLetter);
  if (bracketMatches.length > 0) return new Set(bracketMatches);

  return normalizeAnswerLetters(plain.replace(/[.。；;:：]+$/g, ''));
}

export function choiceIndicesToLetters(indices: readonly number[]): ChoiceLetter[] {
  return [...new Set(indices)]
    .sort((a, b) => a - b)
    .map((index) => CHOICE_LETTERS[index])
    .filter((letter): letter is ChoiceLetter => Boolean(letter));
}

export function choiceLettersToIndices(letters: Iterable<string>): number[] {
  return [...new Set([...letters].map((letter) => letter.toUpperCase()))]
    .map((letter) => (CHOICE_LETTERS as readonly string[]).indexOf(letter))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);
}

export function choiceLettersToString(letters: Iterable<string>): string {
  return choiceLettersToIndices(letters)
    .map((index) => CHOICE_LETTERS[index])
    .filter(Boolean)
    .join('');
}

export function inferMultipleChoice(answerLetters: Iterable<string>): boolean {
  return choiceLettersToIndices(answerLetters).length >= 2;
}

export function gradeChoiceAnswer(
  selectedIndices: readonly number[],
  expectedLetters: Iterable<string>,
): ChoiceGradeResult {
  const selected = choiceIndicesToLetters(selectedIndices);
  const expected = choiceIndicesToLetters(choiceLettersToIndices(expectedLetters));
  const selectedSet = new Set(selected);
  const expectedSet = new Set(expected);

  const missing = expected.filter((letter) => !selectedSet.has(letter));
  const extra = selected.filter((letter) => !expectedSet.has(letter));

  return {
    correct: missing.length === 0 && extra.length === 0,
    expected,
    selected,
    missing,
    extra,
    multi: expected.length >= 2,
  };
}

function toChoiceLetterSet(value: string): Set<ChoiceLetter> {
  return new Set(value.toUpperCase().split('').filter(isChoiceLetter));
}

function isChoiceLetter(value: string | undefined): value is ChoiceLetter {
  return (CHOICE_LETTERS as readonly string[]).includes(value ?? '');
}
