# @math-rich-editor/react

Unbranded React components for rendering, editing, selecting, and copying math-rich answer content.

## Install

```sh
pnpm add @math-rich-editor/react katex
```

Import the package styles and KaTeX CSS from your app entry:

```ts
import 'katex/dist/katex.min.css';
import '@math-rich-editor/react/styles.css';
```

## Components

- `MathFormula` renders a single LaTeX expression with KaTeX and falls back to source text on render failure.
- `MarkdownMath` renders Markdown with GFM tables and `$...$` / `$$...$$` math. Raw HTML is intentionally disabled.
- `FormulaInput` provides a controlled LaTeX textarea, configurable palette, validation, caret insertion, and preview.
- `InteractiveChoices` provides controlled radio/checkbox choices with optional correct/wrong reveal styling.
- `AnswerStepsEditor` edits step-by-step answers with add/delete controls and guarded boundary merging on Backspace/Delete.
- `useMathClipboard` and `MathCopyBoundary` serialize rendered math back to Markdown-friendly LaTeX during copy.

## Example

```tsx
import { AnswerStepsEditor, MarkdownMath, MathCopyBoundary } from '@math-rich-editor/react';
import { useState } from 'react';

export function SolutionEditor() {
  const [steps, setSteps] = useState(['Use $a^2+b^2=c^2$.']);

  return (
    <MathCopyBoundary>
      <MarkdownMath>{'The identity is $a^2+b^2=c^2$.'}</MarkdownMath>
      <AnswerStepsEditor steps={steps} onChange={setSteps} />
    </MathCopyBoundary>
  );
}
```

## Core clipboard adapter

If `@math-rich-editor/core` provides a DOM serializer, pass it through the structural adapter:

```tsx
import * as core from '@math-rich-editor/core';
import { MathCopyBoundary } from '@math-rich-editor/react';

<MathCopyBoundary core={core}>...</MathCopyBoundary>;
```

The React package also includes a DOM fallback that reads the neutral `data-math-source` marker and
KaTeX annotations.
