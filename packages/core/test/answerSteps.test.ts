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

describe('step answer text helpers', () => {
  it('formats and parses numbered step answers', () => {
    const formatted = formatStepAnswer({ steps: ['  let x = 1 ', 'therefore x^2 = 1'] });

    expect(formatted).toBe('1. let x = 1\n2. therefore x^2 = 1');
    expect(stepTextToLines(formatted)).toEqual(['let x = 1', 'therefore x^2 = 1']);
    expect(textToStepAnswer(formatted).steps).toEqual(['let x = 1', 'therefore x^2 = 1']);
  });

  it('handles bullets, empty input, and raw editor lines', () => {
    expect(stepTextToLines('* first\n- second\nA. third')).toEqual(['first', 'second', 'third']);
    expect(stepTextToLines('')).toEqual(['']);
    expect(rawTextToEditorLines('  a  \n\n b')).toEqual(['a', 'b']);
    expect(joinEditorLines([' a ', '', ' b '])).toBe('a\nb');
  });

  it('splits and merges step text around cursor positions', () => {
    expect(splitStepAtCursor(['abcdef'], 0, 3)).toEqual(['abc', 'def']);
    expect(mergeStepWithPrevious(['one', 'two'], 1)).toEqual(['one\ntwo']);
    expect(mergeStepWithNext(['one', 'two'], 0)).toEqual(['one\ntwo']);
  });
});

describe('step boundary deletion state machine', () => {
  it('maps beforeinput deletion types to physical keys', () => {
    expect(deletionKeyFromInputType('deleteContentBackward')).toBe('Backspace');
    expect(deletionKeyFromInputType('deleteContentForward')).toBe('Delete');
    expect(deletionKeyFromInputType('insertText')).toBeNull();
  });

  it('arms on first boundary deletion and merges on the confirmed second press', () => {
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

  it('does not merge repeated keydown events while already armed', () => {
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
