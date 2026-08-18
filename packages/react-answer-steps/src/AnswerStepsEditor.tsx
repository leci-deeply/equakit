import { useState } from 'react';
import type { KeyboardEvent } from 'react';

import {
  mergeStepWithNext,
  mergeStepWithPrevious,
  stepBoundaryDeletionAction,
  type StepBoundaryDeletionAction,
  type StepBoundaryDeletionKey,
} from '@equakit/answer-steps';

export type StepBoundaryKey = StepBoundaryDeletionKey;
export type StepBoundaryAction = StepBoundaryDeletionAction;

export interface StepBoundaryState {
  key: string;
  selectionStart: number;
  selectionEnd: number;
  valueLength: number;
  stepIndex: number;
  stepCount: number;
  armedStepIndex: number | null;
  repeat?: boolean;
}

export interface AnswerStepsEditorProps {
  steps: readonly string[];
  onChange: (nextSteps: string[]) => void;
  className?: string;
  disabled?: boolean;
  minSteps?: number;
  addLabel?: string;
  deleteLabel?: string;
  stepLabel?: (index: number) => string;
  placeholder?: (index: number) => string;
}

export function getStepBoundaryAction({
  key,
  selectionStart,
  selectionEnd,
  valueLength,
  stepIndex,
  stepCount,
  armedStepIndex,
  repeat = false,
}: StepBoundaryState): StepBoundaryAction {
  if (key !== 'Backspace' && key !== 'Delete') return 'none';
  const atBackwardBoundary = key === 'Backspace' && selectionStart === 0 && stepIndex > 0;
  const atForwardBoundary =
    key === 'Delete' && selectionStart === valueLength && stepIndex < stepCount - 1;
  return stepBoundaryDeletionAction({
    key,
    selectionCollapsed: selectionStart === selectionEnd,
    atStepBoundary: atBackwardBoundary || atForwardBoundary,
    targetAlreadyArmed: armedStepIndex === stepIndex,
    repeat,
  });
}

export function mergeStepAtBoundary(
  steps: readonly string[],
  stepIndex: number,
  key: StepBoundaryDeletionKey,
): string[] {
  return key === 'Backspace'
    ? mergeStepWithPrevious(steps, stepIndex)
    : mergeStepWithNext(steps, stepIndex);
}

export function AnswerStepsEditor({
  steps,
  onChange,
  className,
  disabled = false,
  minSteps = 1,
  addLabel = '添加步骤',
  deleteLabel = '删除步骤',
  stepLabel = (index) => `步骤 ${index + 1}`,
  placeholder = (index) => `填写步骤 ${index + 1}`,
}: AnswerStepsEditorProps) {
  const [armedStepIndex, setArmedStepIndex] = useState<number | null>(null);
  const normalizedSteps = steps.length > 0 ? [...steps] : [''];

  function updateStep(index: number, value: string) {
    setArmedStepIndex(null);
    onChange(normalizedSteps.map((step, stepIndex) => (stepIndex === index ? value : step)));
  }

  function addStep(afterIndex = normalizedSteps.length - 1) {
    setArmedStepIndex(null);
    const next = [...normalizedSteps];
    next.splice(afterIndex + 1, 0, '');
    onChange(next);
  }

  function deleteStep(index: number) {
    if (normalizedSteps.length <= minSteps) return;
    setArmedStepIndex(null);
    onChange(normalizedSteps.filter((_step, stepIndex) => stepIndex !== index));
  }

  function handleBoundaryKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (disabled || (event.key !== 'Backspace' && event.key !== 'Delete')) {
      setArmedStepIndex(null);
      return;
    }
    const target = event.currentTarget;
    const action = getStepBoundaryAction({
      key: event.key,
      selectionStart: target.selectionStart,
      selectionEnd: target.selectionEnd,
      valueLength: target.value.length,
      stepIndex: index,
      stepCount: normalizedSteps.length,
      armedStepIndex,
      repeat: event.repeat,
    });

    if (action === 'none') {
      setArmedStepIndex(null);
      return;
    }
    event.preventDefault();
    if (action === 'hold') return;
    if (action === 'arm') {
      setArmedStepIndex(index);
      return;
    }
    onChange(mergeStepAtBoundary(normalizedSteps, index, event.key));
    setArmedStepIndex(null);
  }

  return (
    <div className={className ? `mre-answer-steps ${className}` : 'mre-answer-steps'}>
      {normalizedSteps.map((step, index) => (
        <div className="mre-answer-steps__row" key={index}>
          <label className="mre-answer-steps__label">
            <span>{stepLabel(index)}</span>
            <textarea
              aria-label={stepLabel(index)}
              className="mre-answer-steps__textarea"
              disabled={disabled}
              onChange={(event) => updateStep(index, event.target.value)}
              onKeyDown={(event) => handleBoundaryKey(event, index)}
              placeholder={placeholder(index)}
              rows={3}
              value={step}
            />
          </label>
          <button
            className="mre-answer-steps__delete"
            disabled={disabled || normalizedSteps.length <= minSteps}
            onClick={() => deleteStep(index)}
            type="button"
          >
            {deleteLabel}
          </button>
        </div>
      ))}
      <button
        className="mre-answer-steps__add"
        disabled={disabled}
        onClick={() => addStep()}
        type="button"
      >
        {addLabel}
      </button>
    </div>
  );
}
