import { useMemo, useState } from 'react';

import {
  AnswerStepsEditor,
  FormulaInput,
  InteractiveChoices,
  MarkdownMath,
  MathCopyBoundary,
  MathFormula,
} from '@math-rich-editor/react';

const explanation = String.raw`
## A safe math-rich workflow

The renderer accepts Markdown and LaTeX such as $f(x)=x^2+1$ without enabling raw HTML.

$$
\int_0^1 x^2\,\mathrm{d}x=\frac{1}{3}
$$

Select and copy this content: the copy boundary preserves canonical LaTeX instead of visual glyphs.
`;

export function App() {
  const [formula, setFormula] = useState(String.raw`\frac{-b\pm\sqrt{b^2-4ac}}{2a}`);
  const [steps, setSteps] = useState([
    String.raw`Expand $(x+1)^2=x^2+2x+1$.`,
    String.raw`Collect terms and solve for $x$.`,
  ]);
  const [selected, setSelected] = useState<string[]>([]);
  const correct = useMemo(() => ['1'], []);

  return (
    <main className="demo-shell">
      <header className="demo-hero">
        <p className="demo-eyebrow">Framework-safe math authoring</p>
        <h1>Math Rich Editor Kit</h1>
        <p>
          A neutral demo of math rendering, formula authoring, accessible answers, and canonical
          copy behavior.
        </p>
      </header>

      <section className="demo-grid">
        <article className="demo-card demo-card--wide">
          <h2>Markdown and copy recovery</h2>
          <MathCopyBoundary>
            <MarkdownMath>{explanation}</MarkdownMath>
          </MathCopyBoundary>
        </article>

        <article className="demo-card">
          <h2>Formula input</h2>
          <FormulaInput onChange={setFormula} value={formula} />
          <div className="demo-result">
            <MathFormula display expression={formula} />
          </div>
        </article>

        <article className="demo-card">
          <h2>Accessible choices</h2>
          <InteractiveChoices
            choices={['$x=1$', '$x=2$', '$x=3$']}
            correct={correct}
            onChange={setSelected}
            reveal={selected.length > 0}
            selected={selected}
          />
        </article>

        <article className="demo-card demo-card--wide">
          <h2>Step-by-step answer editor</h2>
          <p>
            At a step boundary, the first Backspace/Delete arms the merge and the second confirms
            it, preventing accidental loss.
          </p>
          <AnswerStepsEditor onChange={setSteps} steps={steps} />
        </article>
      </section>
    </main>
  );
}
