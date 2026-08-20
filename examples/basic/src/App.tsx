import { useEffect, useRef, useState } from 'react';

import {
  mergeStepWithNext,
  mergeStepWithPrevious,
  stepBoundaryDeletionAction,
  textToStepAnswer,
} from '@equakit/answer-steps';
import type { MathClipboardFormatConverter } from '@equakit/clipboard-formats';
import { extractMathTokens, normalizeMarkdownMath } from '@equakit/math-text';
import { MathLiveFormulaEditor } from '@equakit/mathlive-editor';
import { AnswerStepsEditor, type AnswerStepEditorRenderProps } from '@equakit/react-answer-steps';
import { MathCopyBoundary } from '@equakit/react-clipboard';
import { FormulaInput, type FormulaInputEditorKeyDownEvent } from '@equakit/react-formula-input';
import { MathFormula } from '@equakit/react-katex';
import { MarkdownMath } from '@equakit/react-markdown-math';

const heroSpecimen = String.raw`\int_{-\infty}^{\infty}e^{-x^2}\,\mathrm{d}x=\sqrt{\pi}`;
const tallFormula = String.raw`\left\{\begin{aligned}F(x)&=\frac{\displaystyle\sum_{k=1}^{n}\frac{x_k^2}{1+x_k^2}}{\displaystyle\sqrt{\int_{0}^{\infty}\frac{e^{-t^2}}{1+t^4}\,\mathrm{d}t}}\\[0.8em]G(x)&=\prod_{j=1}^{m}\left(1+\frac{a_j^2}{b_j^2}\right)^{\frac{1}{j}}\end{aligned}\right.`;
const responsiveFormula = String.raw`\displaystyle \widehat{f}(\xi)=\int_{-\infty}^{\infty}f(x)e^{-2\pi i x\xi}\,\mathrm{d}x,\qquad f(x)=\int_{-\infty}^{\infty}\widehat{f}(\xi)e^{2\pi i x\xi}\,\mathrm{d}\xi`;
const copyFormula = String.raw`\int_0^\infty e^{-x^2}\,\mathrm{d}x=\frac{\sqrt{\pi}}{2}`;
const initialMarkdownSource = String.raw`圆的面积为 \(S=\pi r^2\)。

\[
\int_0^1 x^2\,\mathrm{d}x=\frac{1}{3}
\]`;
const richMarkdownSource = String.raw`使用 **配方法** 求解 $x^2-6x+5=0$：

- 配方得到 $(x-3)^2=4$
- 因此有两个解

$$
x=1\quad\text{或}\quad x=5
$$`;
const initialStepImport = String.raw`1. x^2-5x+6=0
2. (x-2)(x-3)=0
3. x=2\text{ 或 }x=3`;
const STEP_MERGE_CONFIRMATION_DELAY_MS = 60;

function renderMathStepEditor({
  value,
  onChange,
  ariaLabel,
  disabled,
  placeholder,
}: AnswerStepEditorRenderProps) {
  return (
    <FormulaInput
      className="demo-answer-step__formula"
      disabled={disabled}
      editor={MathLiveFormulaEditor}
      hidePreview
      onChange={onChange}
      palette={[]}
      placeholder={placeholder}
      textareaLabel={`${ariaLabel}公式`}
      value={value}
    />
  );
}

export function App() {
  const [formula, setFormula] = useState(String.raw`\sum_{k=1}^{n}k=\frac{n(n+1)}{2}`);
  const [stepImport, setStepImport] = useState(initialStepImport);
  const [steps, setSteps] = useState([
    String.raw`x^2-5x+6=0`,
    String.raw`(x-2)(x-3)=0`,
    String.raw`x\in\{2,3\}`,
  ]);

  return (
    <main className="demo-shell" id="main-content" tabIndex={-1}>
      <a className="demo-skip-link" href="#demo-collection">
        跳到示例
      </a>

      <header className="demo-topbar">
        <a className="demo-brand" href="#main-content" aria-label="返回页面顶部">
          <span className="demo-brand__name">EquaKit Playground</span>
        </a>

        <nav className="demo-links" aria-label="项目链接">
          <a href={`${import.meta.env.BASE_URL}api/`}>API 文档</a>
          <a href="https://github.com/leci-deeply/equakit">GitHub</a>
        </nav>
      </header>

      <section className="demo-hero" aria-labelledby="demo-title">
        <div className="demo-hero__copy">
          <h1 id="demo-title">EquaKit</h1>
        </div>

        <aside className="demo-hero__formula" aria-label="LaTeX 示例">
          <MathFormula display expression={heroSpecimen} />
          <p>同一份公式可渲染、复制并继续编辑。</p>
        </aside>
      </section>

      <section
        className="demo-collection"
        id="demo-collection"
        aria-labelledby="demo-collection-title"
      >
        <div className="demo-collection__head">
          <h2 id="demo-collection-title" className="demo-collection__title">
            交互示例
          </h2>
        </div>

        <div className="demo-grid">
          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">01</span>
              <span className="demo-card__spec">MathLive / 所见即所得</span>
            </header>
            <h2>可视化公式输入</h2>
            <FormulaInput
              className="demo-formula-workbench"
              editor={MathLiveFormulaEditor}
              hidePreview
              onChange={setFormula}
              palette={[]}
              textareaLabel="可视化公式输入区"
              value={formula}
            />
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">02</span>
              <span className="demo-card__spec">复制 / 粘贴 / 继续编辑</span>
            </header>
            <h2>公式复制与继续编辑</h2>
            <MultiFormatCopyDemo />
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">03</span>
              <span className="demo-card__spec">视觉回归 / KaTeX</span>
            </header>
            <h2>KaTeX 视觉回归矩阵</h2>
            <MathCopyBoundary>
              <KaTeXVisualMatrix />
              <FormulaLayoutDemos />
            </MathCopyBoundary>
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">04</span>
              <span className="demo-card__spec">文本导入 / 分步作答</span>
            </header>
            <h2>解题过程转为公式步骤</h2>
            <div className="demo-step-converter">
              <section className="demo-step-converter__panel" aria-labelledby="step-source-title">
                <div className="demo-panel-heading">
                  <strong id="step-source-title">粘贴解题过程</strong>
                  <span>每行一个公式</span>
                </div>
                <textarea
                  aria-label="粘贴解题过程"
                  id="step-import-source"
                  onChange={(event) => setStepImport(event.target.value)}
                  rows={7}
                  spellCheck={false}
                  value={stepImport}
                />
                <button
                  className="demo-action"
                  onClick={() => setSteps(textToStepAnswer(stepImport).steps)}
                  type="button"
                >
                  转换为步骤
                </button>
              </section>
              <span className="demo-step-converter__arrow" aria-hidden="true">
                →
              </span>
              <section className="demo-step-converter__panel" aria-labelledby="step-result-title">
                <div className="demo-panel-heading">
                  <strong id="step-result-title">可编辑公式步骤</strong>
                  <span>{steps.length} 步</span>
                </div>
                <AnswerStepsEditor
                  addLabel="＋ 添加一步"
                  className="demo-answer-steps"
                  onChange={setSteps}
                  renderStepEditor={renderMathStepEditor}
                  steps={steps}
                />
              </section>
            </div>
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header demo-card__header--stacked">
              <span className="demo-card__index">05</span>
              <div className="demo-card__meta">
                <span className="demo-card__spec">不同公式写法自动兼容</span>
                <div className="demo-syntax-legend" aria-label="支持的公式写法">
                  <span>
                    <code>\(...\)</code> 行内公式
                  </span>
                  <span>
                    <code>\[...\]</code> 块级公式
                  </span>
                </div>
              </div>
            </header>
            <h2>数学文本转换</h2>
            <MarkdownCompatibilityDemo />
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">06</span>
              <span className="demo-card__spec">复制 / Markdown / LaTeX</span>
            </header>
            <h2>富文本公式恢复</h2>
            <RichTextRestoreDemo />
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">07</span>
              <span className="demo-card__spec">步骤 / 拆分 / 合并</span>
            </header>
            <h2>步骤结构编辑</h2>
            <StepStructureDemo />
          </article>
        </div>
      </section>

      <footer className="demo-footer">
        <p>EquaKit · MIT License</p>
      </footer>
    </main>
  );
}

function MarkdownCompatibilityDemo() {
  const [markdownSource, setMarkdownSource] = useState(initialMarkdownSource);
  const normalizedMarkdown = normalizeMarkdownMath(markdownSource);
  const mathTokens = extractMathTokens(normalizedMarkdown);
  const inlineFormulaCount = mathTokens.filter((token) => !token.display).length;
  const blockFormulaCount = mathTokens.filter((token) => token.display).length;

  return (
    <div className="demo-transform-grid">
      <div className="demo-field">
        <textarea
          aria-label="公式内容"
          id="markdown-source"
          onChange={(event) => setMarkdownSource(event.target.value)}
          rows={9}
          spellCheck={false}
          value={markdownSource}
        />
      </div>
      <div className="demo-transform-output" aria-live="polite">
        <span className="demo-field__label">识别后的显示</span>
        <MarkdownMath>{normalizedMarkdown}</MarkdownMath>
        <output className="demo-transform-output__status">
          已识别 {inlineFormulaCount} 个行内公式和 {blockFormulaCount} 个块级公式
        </output>
      </div>
    </div>
  );
}

function RichTextRestoreDemo() {
  const [restoredMarkdown, setRestoredMarkdown] = useState('');

  return (
    <div className="demo-transform-grid">
      <div className="demo-rich-source">
        <span className="demo-field__label">框选并复制</span>
        <MathCopyBoundary options={{ displayMathSelector: '.katex-display .katex' }}>
          <div data-testid="rich-math-source">
            <MarkdownMath>{richMarkdownSource}</MarkdownMath>
          </div>
        </MathCopyBoundary>
      </div>
      <label className="demo-field" htmlFor="restored-markdown">
        <span>粘贴后的 Markdown + LaTeX</span>
        <textarea
          id="restored-markdown"
          onChange={(event) => setRestoredMarkdown(event.target.value)}
          placeholder="在这里粘贴"
          rows={11}
          spellCheck={false}
          value={restoredMarkdown}
        />
      </label>
    </div>
  );
}

function StepStructureDemo() {
  const [structuredSteps, setStructuredSteps] = useState([
    String.raw`x^2-5x+6=0`,
    String.raw`(x-2)(x-3)=0`,
    String.raw`x\in\{2,3\}`,
  ]);
  const [armedStep, setArmedStep] = useState<number | null>(null);
  const armedStepRef = useRef<number | null>(null);
  const armedStepAtRef = useRef(0);

  function setMergeArm(index: number | null) {
    armedStepRef.current = index;
    armedStepAtRef.current = index === null ? 0 : Date.now();
    setArmedStep(index);
  }

  function updateStep(index: number, value: string) {
    setMergeArm(null);
    setStructuredSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? value : step)),
    );
  }

  function focusStep(index: number, caret: 'start' | 'end') {
    globalThis.requestAnimationFrame?.(() => {
      const target = document.querySelector<
        HTMLElement & { position: number; lastOffset: number; shadowRoot: ShadowRoot | null }
      >(`math-field[aria-label="结构步骤 ${index + 1}"]`);
      if (!target) return;
      const keyboardSink = target.shadowRoot?.querySelector<HTMLElement>('[part~="keyboard-sink"]');
      (keyboardSink ?? target).focus();
      target.position = caret === 'start' ? 0 : target.lastOffset;
    });
  }

  function handleStepKey(event: FormulaInputEditorKeyDownEvent, index: number) {
    if (event.key === 'Enter') {
      event.preventDefault();
      setStructuredSteps((current) => {
        const next = [...current];
        next.splice(index, 1, event.valueBeforeCursor, event.valueAfterCursor);
        return next;
      });
      setMergeArm(null);
      focusStep(index + 1, 'start');
      return;
    }

    const atStepBoundary =
      (event.key === 'Backspace' && event.atStart && index > 0) ||
      (event.key === 'Delete' && event.atEnd && index < structuredSteps.length - 1);
    const action = stepBoundaryDeletionAction({
      key: event.key,
      selectionCollapsed: event.selectionCollapsed,
      atStepBoundary,
      targetAlreadyArmed:
        armedStepRef.current === index &&
        Date.now() - armedStepAtRef.current >= STEP_MERGE_CONFIRMATION_DELAY_MS,
      repeat: event.repeat,
    });

    if (action === 'none') {
      setMergeArm(null);
      return;
    }

    event.preventDefault();
    if (action === 'hold') return;
    if (action === 'arm') {
      setMergeArm(index);
      return;
    }

    const mergingBackward = event.key === 'Backspace';
    setStructuredSteps((current) =>
      mergingBackward ? mergeStepWithPrevious(current, index) : mergeStepWithNext(current, index),
    );
    setMergeArm(null);
    focusStep(mergingBackward ? index - 1 : index, 'end');
  }

  return (
    <div className="demo-step-structure">
      <div className="demo-step-shortcuts" aria-label="步骤编辑操作">
        <span>Enter 拆分</span>
        <span>两次 Backspace / Delete 合并</span>
      </div>
      <div className="demo-step-structure__list">
        {structuredSteps.map((step, index) => (
          <div className="demo-step-structure__row" key={index}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <FormulaInput
              className="demo-step-structure__formula"
              editor={MathLiveFormulaEditor}
              hidePreview
              onChange={(value) => updateStep(index, value)}
              onEditorKeyDown={(event) => handleStepKey(event, index)}
              palette={[]}
              placeholder=""
              textareaLabel={`结构步骤 ${index + 1}`}
              value={step}
            />
          </div>
        ))}
      </div>
      {armedStep !== null && (
        <p className="demo-step-structure__status" role="status">
          再次按相同按键以合并相邻步骤。
        </p>
      )}
    </div>
  );
}

const visualRegressionFormulas = [
  String.raw`\frac{-b\pm\sqrt{b^2-4ac}}{2a}`,
  String.raw`\left(\frac{x+1}{x-1}\right)^2 + \left\lVert \vec{v}\right\rVert`,
  String.raw`\begin{pmatrix}a&b\\c&d\end{pmatrix}\begin{cases}x+y=1\\x-y=0\end{cases}`,
  String.raw`\lim_{n\to\infty}\sum_{i=1}^{n}\frac{1}{i^2}=\frac{\pi^2}{6}`,
  String.raw`\int_0^1 x^2\,\mathrm{d}x + \prod_{k=1}^{m} k`,
  String.raw`\mathbb{R}\;\mathcal{F}\;\boldsymbol{\alpha}\;\overbrace{a+b}^{n}\;x_{i_j}^{2^k}`,
] as const;

function KaTeXVisualMatrix() {
  return (
    <div className="demo-katex-visual" data-testid="katex-visual-matrix">
      {visualRegressionFormulas.map((expression, index) => (
        <div className="demo-katex-visual__cell" key={expression}>
          <span className="demo-katex-visual__index">{String(index + 1).padStart(2, '0')}</span>
          <MathFormula ariaLabel={`视觉公式 ${index + 1}`} display expression={expression} />
        </div>
      ))}
    </div>
  );
}

function FormulaLayoutDemos() {
  const [containerWidth, setContainerWidth] = useState(220);

  return (
    <div className="demo-formula-layout" aria-label="公式布局验证">
      <section className="demo-formula-layout__sample" data-testid="formula-height-sample">
        <h3>高度自适应</h3>
        <MathFormula ariaLabel="高度自适应公式" display expression={tallFormula} />
        <p data-testid="formula-height-following">公式后的正文不会被上下标或根式覆盖。</p>
      </section>
      <section
        className="demo-formula-layout__sample demo-formula-layout__sample--responsive"
        data-testid="formula-responsive-width-sample"
      >
        <div className="demo-formula-resize__header">
          <h3>动态宽度适配</h3>
          <output htmlFor="formula-width-control">{containerWidth}px</output>
        </div>
        <label className="demo-formula-resize__control" htmlFor="formula-width-control">
          <span>容器宽度</span>
          <input
            id="formula-width-control"
            max="640"
            min="220"
            onChange={(event) => setContainerWidth(Number(event.target.value))}
            step="20"
            type="range"
            value={containerWidth}
          />
        </label>
        <div className="demo-formula-resize__stage" data-testid="formula-responsive-width-stage">
          <div
            className="demo-formula-resize__frame"
            data-testid="formula-responsive-width-frame"
            style={{ width: `${containerWidth}px` }}
          >
            <MarkdownMath overflowIndicator="hover-scrollbar">
              {`$$${responsiveFormula}$$`}
            </MarkdownMath>
          </div>
        </div>
      </section>
    </div>
  );
}

function MultiFormatCopyDemo() {
  const [converter, setConverter] = useState<MathClipboardFormatConverter | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [targetFormula, setTargetFormula] = useState('');

  useEffect(() => {
    let disposed = false;
    void import('@equakit/mathlive-formats')
      .then(({ mathLiveClipboardConverter }) => {
        if (!disposed) setConverter(mathLiveClipboardConverter);
      })
      .catch(() => {
        if (!disposed) setLoadFailed(true);
      });
    return () => {
      disposed = true;
    };
  }, []);

  if (loadFailed) return <span role="alert">多格式转换器加载失败。</span>;
  if (!converter) return <span role="status">正在加载多格式转换器。</span>;

  return (
    <div className="demo-copy-transfer">
      <section className="demo-copy-transfer__panel" aria-labelledby="copy-source-label">
        <span className="demo-copy-transfer__label" id="copy-source-label">
          复制公式
        </span>
        <MathCopyBoundary converter={converter}>
          <div className="demo-copy-example" aria-label="多格式复制公式" role="group">
            <MathFormula ariaLabel="高斯积分" display expression={copyFormula} />
            <code>LaTeX · MathML · AsciiMath · MathJSON</code>
          </div>
        </MathCopyBoundary>
      </section>

      <span className="demo-copy-transfer__arrow" aria-hidden="true">
        →
      </span>

      <section className="demo-copy-transfer__panel" aria-labelledby="copy-target-label">
        <span className="demo-copy-transfer__label" id="copy-target-label">
          粘贴并继续编辑
        </span>
        <FormulaInput
          className="demo-copy-transfer__input"
          editor={MathLiveFormulaEditor}
          hidePreview
          onChange={setTargetFormula}
          palette={[]}
          placeholder=""
          textareaLabel="公式粘贴输入区"
          value={targetFormula}
        />
      </section>
    </div>
  );
}
