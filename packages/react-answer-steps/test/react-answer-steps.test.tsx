import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AnswerStepsEditor, getStepBoundaryAction, mergeStepAtBoundary } from '../src/index.js';

describe('@equakit/react-answer-steps', () => {
  it('合并步骤前保护步骤边界删除', () => {
    expect(
      getStepBoundaryAction({
        key: 'Backspace',
        selectionStart: 0,
        selectionEnd: 0,
        valueLength: 4,
        stepIndex: 1,
        stepCount: 2,
        armedStepIndex: null,
      }),
    ).toBe('arm');
    expect(
      getStepBoundaryAction({
        key: 'Backspace',
        selectionStart: 0,
        selectionEnd: 0,
        valueLength: 4,
        stepIndex: 1,
        stepCount: 2,
        armedStepIndex: 1,
      }),
    ).toBe('merge');
    expect(mergeStepAtBoundary(['第一步', '第二步'], 1, 'Backspace')).toEqual(['第一步\n第二步']);
  });

  it('渲染可访问的受控 textarea 和默认中文文案', () => {
    const html = renderToStaticMarkup(
      <AnswerStepsEditor onChange={() => undefined} steps={['第一步', '第二步']} />,
    );
    expect(html).toContain('步骤 1');
    expect(html).toContain('第一步');
    expect(html).toContain('添加步骤');
    expect(html).toContain('删除步骤');
  });
});
