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
  it('安全渲染 KaTeX 并保留可供复制适配器读取的源码表达式', () => {
    const html = renderToStaticMarkup(<MathFormula expression={'\\frac{1}{2}'} />);
    expect(html).toContain('katex');
    expect(html).toContain('mfrac');
    expect(html).toMatch(/data-math-source="\\+frac\{1\}\{2\}"/);
  });

  it('KaTeX 拒绝表达式时回退显示源码文本', () => {
    const html = renderToStaticMarkup(<MathFormula expression={'\\frac{1'} />);
    expect(html).toContain('\\frac{1');
    expect(html).not.toContain('katex-error');
  });

  it('渲染 Markdown 数学内容且不渲染原始 HTML', () => {
    const html = renderToStaticMarkup(
      <MarkdownMath>
        {'你好 $x^2$ <img src=x onerror=alert(1)> [坏链接](javascript:alert(1))'}
      </MarkdownMath>,
    );
    expect(html).toContain('katex');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
  });

  it('过滤不安全 URL 并保留安全 URL', () => {
    expect(safeUrlTransform('javascript:alert(1)')).toBe('');
    expect(safeUrlTransform('//example.com/a', ['mailto:'])).toBe('');
    expect(safeUrlTransform('https://example.com/a')).toBe('https://example.com/a');
    expect(safeUrlTransform('/docs')).toBe('/docs');
  });

  it('校验 LaTeX 表达式', () => {
    expect(validateLatexExpression('\\frac{1}{2}').ok).toBe(true);
    expect(validateLatexExpression('\\frac{1').ok).toBe(false);
  });

  it('按光标偏移插入公式片段', () => {
    expect(
      insertFormulaSnippet('ab', { label: 'frac', insert: '\\frac{}{}', caretOffset: 6 }, 1, 1),
    ).toEqual({
      value: 'a\\frac{}{}b',
      caret: 7,
    });
  });

  it('使用自定义面板渲染 FormulaInput', () => {
    const html = renderToStaticMarkup(
      <FormulaInput
        hidePreview
        onChange={() => undefined}
        palette={[{ label: '集合', keys: [{ label: '并集', insert: '\\cup ' }] }]}
        value=""
      />,
    );
    expect(html).toContain('公式面板');
    expect(html).toContain('并集');
  });

  it('渲染可访问的受控选项和结果状态', () => {
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

  it('将 AnswerStepsEditor 渲染为受控 textarea', () => {
    const html = renderToStaticMarkup(
      <AnswerStepsEditor onChange={() => undefined} steps={['第一步', '第二步']} />,
    );
    expect(html).toContain('步骤 1');
    expect(html).toContain('第一步');
    expect(html).toContain('添加步骤');
  });

  it('归一化剪贴板文本并适配 core 序列化器', () => {
    expect(normalizeClipboardText('  \\\\frac{1}{2}  ')).toBe('\\(\\\\frac{1}{2}\\)');
    const serializer = createCoreMathClipboardSerializer({
      serializeRenderedMath: () => '来自 core',
    });
    expect(serializer({ root: fakeParentNode() })).toBe('来自 core');
  });

  it('DOM 节点可用时序列化渲染后的数学 annotation', () => {
    if (typeof DOMParser === 'undefined') return;
    const doc = new DOMParser().parseFromString(
      '<p>结果 <span data-math-source="x^2"><span class="katex">x</span></span></p>',
      'text/html',
    );
    expect(serializeRenderedMath({ root: doc.body })).toBe('结果 \\(x^2\\)');
  });
});

function fakeParentNode(): ParentNode {
  return { childNodes: [] } as unknown as ParentNode;
}
