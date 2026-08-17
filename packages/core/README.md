# @math-rich-editor/core

Framework-free TypeScript utilities for math-heavy rich-text editors.

This package is intentionally generic: it contains no product names, no backend APIs, no
domain-specific learning concepts, and no private marker conventions. It is suitable as the core
layer for React, Vue, Svelte, ProseMirror, Slate, Lexical, or plain `contenteditable` integrations.

## Features

- Normalize Markdown and LaTeX math delimiters before rendering.
- Strip math delimiters from standalone LaTeX expressions.
- Validate inline and display math with KaTeX.
- Recover Markdown and LaTeX from rendered DOM/HTML copied out of a rich math surface.
- Configure the formula marker attribute, defaulting to `data-math-source`.
- Convert OCR/uploaded/free-form answer text into stable step lines.
- Use a two-press Backspace/Delete state machine for step-boundary merges.
- Parse and grade A-H single-choice or multiple-choice answers.
- Guard async responses with keyed mutation versions and optional scope matching.

## Install

```sh
pnpm add @math-rich-editor/core katex
```

KaTeX is a runtime dependency for the default validation functions.

## Math normalization

```ts
import { normalizeMarkdownMath, validateMarkdownMath } from '@math-rich-editor/core';

const markdown = normalizeMarkdownMath(String.raw`
Area is \(a^2\).
\frac{1}{2} + \sqrt{x}
`);

const result = validateMarkdownMath(markdown);
if (!result.ok) {
  console.log(result.issues);
}
```

## Rich clipboard recovery

When rendering formulas, attach the source LaTeX to the formula wrapper:

```html
<span class="katex" data-math-source="\frac{a}{b}">...</span>
```

Then recover editable Markdown/LaTeX from copied HTML or a live selection:

```ts
import { richHtmlToMarkdown, richSelectionToMarkdown } from '@math-rich-editor/core';

const markdown = richHtmlToMarkdown(
  event.clipboardData.getData('text/html'),
  event.clipboardData.getData('text/plain'),
);

const selected = richSelectionToMarkdown(range, editorRoot, selection.toString(), {
  mathSourceAttribute: 'data-latex',
  decodeMathSource: decodeURIComponent,
});
```

The serializer also falls back to MathML annotations such as
`annotation[encoding="application/x-tex"]` when no marker is present.

## Step-answer helpers

```ts
import {
  formatStepAnswer,
  stepBoundaryDeletionAction,
  stepTextToLines,
} from '@math-rich-editor/core';

const lines = stepTextToLines('1. Let x = 1\n2. Therefore x^2 = 1');
const text = formatStepAnswer({ steps: lines });

const action = stepBoundaryDeletionAction({
  key: 'Backspace',
  selectionCollapsed: true,
  atStepBoundary: true,
  targetAlreadyArmed: false,
});
```

`stepBoundaryDeletionAction` returns:

- `none`: let the editor handle the event normally.
- `arm`: prevent default deletion and remember the boundary range.
- `hold`: ignore repeated keydown while the same boundary is armed.
- `merge`: perform the step merge after an intentional second press.

## Choice grading

```ts
import { gradeChoiceAnswer, parseChoiceAnswer } from '@math-rich-editor/core';

const expected = parseChoiceAnswer('正确答案：A、C');
if (expected) {
  const result = gradeChoiceAnswer([2, 0], expected);
  console.log(result.correct); // true
}
```

Answers are limited to A-H. Punctuation, spacing, `选 D`, `$D$`, `答案：AC`, and
`\mathrm{A C}`-style display answers are accepted. Negative phrases such as `不是 A` are not guessed.

## Async stale-response guard

```ts
import { StaleResponseGuard } from '@math-rich-editor/core';

const guard = new StaleResponseGuard<string>();

guard.setScope('problem-1');
const snapshot = guard.begin('check-answer');
const response = await checkAnswer();

if (guard.isCurrent(snapshot)) {
  applyResult(response);
}
```

For plain map-based state, use `nextMutationVersion` and `isCurrentMutation`.
