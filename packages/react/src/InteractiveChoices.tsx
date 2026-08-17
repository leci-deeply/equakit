import { MarkdownMath } from './MarkdownMath.js';

export interface InteractiveChoice {
  id?: string;
  content: string;
  label?: string;
}

export interface InteractiveChoicesProps {
  choices: readonly (InteractiveChoice | string)[];
  selected: readonly string[];
  onChange: (nextSelected: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  correct?: readonly string[];
  reveal?: boolean;
  name?: string;
  className?: string;
  choiceLabel?: (index: number) => string;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function InteractiveChoices({
  choices,
  selected,
  onChange,
  multiple = false,
  disabled = false,
  correct,
  reveal = false,
  name = 'mre-choice',
  className,
  choiceLabel = defaultChoiceLabel,
}: InteractiveChoicesProps) {
  const normalizedChoices = choices.map(normalizeChoice);
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct ?? []);
  const showResult = reveal && correct != null;

  function toggle(choiceId: string) {
    if (disabled) return;
    if (!multiple) {
      onChange(selectedSet.has(choiceId) ? [] : [choiceId]);
      return;
    }
    const next = selectedSet.has(choiceId)
      ? selected.filter((id) => id !== choiceId)
      : [...selected, choiceId];
    onChange(next);
  }

  return (
    <fieldset
      className={className ? `mre-interactive-choices ${className}` : 'mre-interactive-choices'}
    >
      {normalizedChoices.map((choice, index) => {
        const checked = selectedSet.has(choice.id);
        const correctChoice = correctSet.has(choice.id);
        const state = showResult
          ? correctChoice
            ? 'correct'
            : checked
              ? 'wrong'
              : 'neutral'
          : checked
            ? 'selected'
            : 'neutral';

        return (
          <label
            className={`mre-interactive-choices__item mre-interactive-choices__item--${state}`}
            key={choice.id}
          >
            <input
              aria-invalid={showResult && checked && !correctChoice ? true : undefined}
              checked={checked}
              disabled={disabled}
              name={multiple ? `${name}-${choice.id}` : name}
              onChange={() => toggle(choice.id)}
              type={multiple ? 'checkbox' : 'radio'}
            />
            <span className="mre-interactive-choices__marker">
              {choice.label ?? choiceLabel(index)}
            </span>
            <span className="mre-interactive-choices__content">
              <MarkdownMath>{choice.content}</MarkdownMath>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function normalizeChoice(
  choice: InteractiveChoice | string,
  index: number,
): Required<InteractiveChoice> {
  if (typeof choice === 'string') {
    return { id: String(index), content: choice, label: defaultChoiceLabel(index) };
  }
  return {
    id: choice.id ?? String(index),
    content: choice.content,
    label: choice.label ?? defaultChoiceLabel(index),
  };
}

function defaultChoiceLabel(index: number): string {
  return LETTERS[index] ?? String(index + 1);
}
