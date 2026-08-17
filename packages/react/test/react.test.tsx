import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  AnswerStepsEditor,
  FormulaInput,
  InteractiveChoices,
  MarkdownMath,
  MathFormula,
  createCoreMathClipboardSerializer,
  getStepBoundaryAction,
  insertFormulaSnippet,
  mergeStepAtBoundary,
  normalizeClipboardText,
  safeUrlTransform,
  serializeRenderedMath,
  validateLatexExpression,
} from '../src/index.js';

describe('@math-rich-editor/react', () => {
  it('renders KaTeX safely and keeps the source expression available for copy adapters', () => {
    const html = renderToStaticMarkup(<MathFormula expression={'\\frac{1}{2}'} />);
    expect(html).toContain('katex');
    expect(html).toContain('mfrac');
    expect(html).toMatch(/data-math-source="\\+frac\{1\}\{2\}"/);
  });

  it('falls back to source text when KaTeX rejects an expression', () => {
    const html = renderToStaticMarkup(<MathFormula expression={'\\frac{1'} />);
    expect(html).toContain('\\frac{1');
    expect(html).not.toContain('katex-error');
  });

  it('renders Markdown math without rendering raw HTML', () => {
    const html = renderToStaticMarkup(
      <MarkdownMath>
        {'Hello $x^2$ <img src=x onerror=alert(1)> [bad](javascript:alert(1))'}
      </MarkdownMath>,
    );
    expect(html).toContain('katex');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
  });

  it('filters unsafe urls and keeps safe urls', () => {
    expect(safeUrlTransform('javascript:alert(1)')).toBe('');
    expect(safeUrlTransform('//example.com/a', ['mailto:'])).toBe('');
    expect(safeUrlTransform('https://example.com/a')).toBe('https://example.com/a');
    expect(safeUrlTransform('/docs')).toBe('/docs');
  });

  it('validates LaTeX expressions', () => {
    expect(validateLatexExpression('\\frac{1}{2}').ok).toBe(true);
    expect(validateLatexExpression('\\frac{1').ok).toBe(false);
  });

  it('inserts formula snippets with caret offsets', () => {
    expect(
      insertFormulaSnippet('ab', { label: 'frac', insert: '\\frac{}{}', caretOffset: 6 }, 1, 1),
    ).toEqual({
      value: 'a\\frac{}{}b',
      caret: 7,
    });
  });

  it('renders FormulaInput with a custom palette', () => {
    const html = renderToStaticMarkup(
      <FormulaInput
        hidePreview
        onChange={() => undefined}
        palette={[{ label: 'Set', keys: [{ label: 'cup', insert: '\\cup ' }] }]}
        value=""
      />,
    );
    expect(html).toContain('Formula palette');
    expect(html).toContain('cup');
  });

  it('renders accessible controlled choices and result state', () => {
    const html = renderToStaticMarkup(
      <InteractiveChoices
        choices={['$1$', '$2$']}
        correct={['1']}
        onChange={() => undefined}
        reveal
        selected={['0']}
      />,
    );
    expect(html).toContain('type="radio"');
    expect(html).toContain('mre-interactive-choices__item--wrong');
    expect(html).toContain('mre-interactive-choices__item--correct');
  });

  it('guards step boundary deletion before merging steps', () => {
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
    expect(mergeStepAtBoundary(['first', 'second'], 1, 'Backspace')).toEqual(['first\nsecond']);
  });

  it('renders AnswerStepsEditor as controlled textareas', () => {
    const html = renderToStaticMarkup(
      <AnswerStepsEditor onChange={() => undefined} steps={['first', 'second']} />,
    );
    expect(html).toContain('Step 1');
    expect(html).toContain('first');
    expect(html).toContain('Add step');
  });

  it('normalizes clipboard text and adapts core serializers', () => {
    expect(normalizeClipboardText('  \\\\frac{1}{2}  ')).toBe('\\(\\\\frac{1}{2}\\)');
    const serializer = createCoreMathClipboardSerializer({
      serializeRenderedMath: () => 'from-core',
    });
    expect(serializer({ root: fakeParentNode() })).toBe('from-core');
  });

  it('serializes rendered math annotations when DOM nodes are available', () => {
    if (typeof DOMParser === 'undefined') return;
    const doc = new DOMParser().parseFromString(
      '<p>A <span data-math-source="x^2"><span class="katex">x</span></span></p>',
      'text/html',
    );
    expect(serializeRenderedMath({ root: doc.body })).toBe('A \\(x^2\\)');
  });
});

function fakeParentNode(): ParentNode {
  return { childNodes: [] } as unknown as ParentNode;
}
