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

describe('选择题判分', () => {
  it('归一化带标点和重复字母的严格 A-H 答案', () => {
    expect([...(normalizeAnswerLetters(' B、A、A ') ?? [])].sort()).toEqual(['A', 'B']);
    expect(normalizeAnswerLetters('I')).toBeNull();
  });

  it('解析展示样式的选择题答案', () => {
    expect([...(parseChoiceAnswer('$D$') ?? [])]).toEqual(['D']);
    expect([...(parseChoiceAnswer('正确答案：A、C') ?? [])].sort()).toEqual(['A', 'C']);
    expect(parseChoiceAnswer('不是 A')).toBeNull();
  });

  it('在选项索引和选项字母之间转换', () => {
    expect(choiceIndicesToLetters([2, 0, 2, 10])).toEqual(['A', 'C']);
    expect(choiceLettersToIndices(['c', 'A', 'Z'])).toEqual([0, 2]);
    expect(choiceLettersToString(['B', 'A'])).toBe('AB');
  });

  it('判定单选和多选答案并给出缺选与多选明细', () => {
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
