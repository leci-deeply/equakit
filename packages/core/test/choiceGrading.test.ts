import { describe, expect, it } from 'vitest';

import {
  choiceIndicesToLetters,
  choiceLettersToIndices,
  choiceLettersToString,
  gradeChoiceAnswer,
  inferMultipleChoice,
  normalizeAnswerLetters,
  parseChoiceAnswer,
} from '../src';

describe('choice grading', () => {
  it('normalizes strict A-H answers with punctuation and duplicated letters', () => {
    expect([...(normalizeAnswerLetters(' B、A、A ') ?? [])].sort()).toEqual(['A', 'B']);
    expect(normalizeAnswerLetters('I')).toBeNull();
  });

  it('parses display-style choice answers', () => {
    expect([...(parseChoiceAnswer('$D$') ?? [])]).toEqual(['D']);
    expect([...(parseChoiceAnswer('正确答案：A、C') ?? [])].sort()).toEqual(['A', 'C']);
    expect(parseChoiceAnswer('不是 A')).toBeNull();
  });

  it('converts between selected indices and choice letters', () => {
    expect(choiceIndicesToLetters([2, 0, 2, 10])).toEqual(['A', 'C']);
    expect(choiceLettersToIndices(['c', 'A', 'Z'])).toEqual([0, 2]);
    expect(choiceLettersToString(['B', 'A'])).toBe('AB');
  });

  it('grades single and multiple choice answers with missing and extra details', () => {
    expect(inferMultipleChoice(['A', 'C'])).toBe(true);

    expect(gradeChoiceAnswer([0, 2], ['C', 'A'])).toMatchObject({
      correct: true,
      selected: ['A', 'C'],
      expected: ['A', 'C'],
      multi: true,
    });

    expect(gradeChoiceAnswer([0, 3], ['A', 'C'])).toMatchObject({
      correct: false,
      missing: ['C'],
      extra: ['D'],
    });
  });
});
