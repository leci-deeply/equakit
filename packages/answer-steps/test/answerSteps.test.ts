import { describe, expect, it } from 'vitest';

import {
  deletionKeyFromInputType,
  formatStepAnswer,
  joinEditorLines,
  mergeStepWithNext,
  mergeStepWithPrevious,
  rawTextToEditorLines,
  splitStepAtCursor,
  stepBoundaryDeletionAction,
  stepTextToLines,
  textToStepAnswer,
} from '../src';

describe('分步答案文本工具', () => {
  it('格式化并解析带编号的分步答案', () => {
    const formatted = formatStepAnswer({ steps: ['  设 x = 1 ', '因此 x^2 = 1'] });

    expect(formatted).toBe('1. 设 x = 1\n2. 因此 x^2 = 1');
    expect(stepTextToLines(formatted)).toEqual(['设 x = 1', '因此 x^2 = 1']);
    expect(textToStepAnswer(formatted).steps).toEqual(['设 x = 1', '因此 x^2 = 1']);
  });

  it('处理项目符号、空输入和编辑器原始行', () => {
    expect(stepTextToLines('* 第一步\n- 第二步\nA. 第三步')).toEqual([
      '第一步',
      '第二步',
      '第三步',
    ]);
    expect(stepTextToLines('')).toEqual(['']);
    expect(rawTextToEditorLines('  a  \n\n b')).toEqual(['a', 'b']);
    expect(joinEditorLines([' a ', '', ' b '])).toBe('a\nb');
  });

  it('按光标位置拆分和合并步骤文本', () => {
    expect(splitStepAtCursor(['abcdef'], 0, 3)).toEqual(['abc', 'def']);
    expect(mergeStepWithPrevious(['前一步', '后一步'], 1)).toEqual(['前一步\n后一步']);
    expect(mergeStepWithNext(['前一步', '后一步'], 0)).toEqual(['前一步\n后一步']);
  });
});

describe('步骤边界删除状态机', () => {
  it('将 beforeinput 删除类型映射为物理按键', () => {
    expect(deletionKeyFromInputType('deleteContentBackward')).toBe('Backspace');
    expect(deletionKeyFromInputType('deleteContentForward')).toBe('Delete');
    expect(deletionKeyFromInputType('insertText')).toBeNull();
  });

  it('第一次边界删除进入待确认状态，第二次确认后合并', () => {
    expect(
      stepBoundaryDeletionAction({
        key: 'Backspace',
        selectionCollapsed: true,
        atStepBoundary: true,
        targetAlreadyArmed: false,
      }),
    ).toBe('arm');

    expect(
      stepBoundaryDeletionAction({
        key: 'Backspace',
        selectionCollapsed: true,
        atStepBoundary: true,
        targetAlreadyArmed: true,
      }),
    ).toBe('merge');
  });

  it('待确认状态下不会因重复 keydown 事件直接合并', () => {
    expect(
      stepBoundaryDeletionAction({
        key: 'Delete',
        selectionCollapsed: true,
        atStepBoundary: true,
        targetAlreadyArmed: true,
        repeat: true,
      }),
    ).toBe('hold');

    expect(
      stepBoundaryDeletionAction({
        key: 'Delete',
        selectionCollapsed: false,
        atStepBoundary: true,
        targetAlreadyArmed: true,
      }),
    ).toBe('none');
  });
});
