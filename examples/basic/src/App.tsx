import { useEffect, useState } from 'react';

import type { MathClipboardFormatConverter } from '@equakit/clipboard-formats';
import { MathLiveFormulaEditor } from '@equakit/mathlive-editor';
import { AnswerStepsEditor } from '@equakit/react-answer-steps';
import { MathCopyBoundary } from '@equakit/react-clipboard';
import { FormulaInput } from '@equakit/react-formula-input';
import { MathFormula } from '@equakit/react-katex';
import { MarkdownMath } from '@equakit/react-markdown-math';
import {
  TIPTAP_MATH_CLIPBOARD_OPTIONS,
  createTipTapMathExtensions,
  migrateEquaKitMathStrings,
} from '@equakit/tiptap-math';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const tipTapMathExtensions = createTipTapMathExtensions();

const heroSpecimen = String.raw`\int_{-\infty}^{\infty}e^{-x^2}\,\mathrm{d}x=\sqrt{\pi}`;
const tallFormula = String.raw`\left\{\begin{aligned}F(x)&=\frac{\displaystyle\sum_{k=1}^{n}\frac{x_k^2}{1+x_k^2}}{\displaystyle\sqrt{\int_{0}^{\infty}\frac{e^{-t^2}}{1+t^4}\,\mathrm{d}t}}\\[0.8em]G(x)&=\prod_{j=1}^{m}\left(1+\frac{a_j^2}{b_j^2}\right)^{\frac{1}{j}}\end{aligned}\right.`;
const responsiveFormula = String.raw`\displaystyle \widehat{f}(\xi)=\int_{-\infty}^{\infty}f(x)e^{-2\pi i x\xi}\,\mathrm{d}x,\qquad f(x)=\int_{-\infty}^{\infty}\widehat{f}(\xi)e^{2\pi i x\xi}\,\mathrm{d}\xi`;
const copyFormula = String.raw`\int_0^\infty e^{-x^2}\,\mathrm{d}x=\frac{\sqrt{\pi}}{2}`;

export function App() {
  const [formula, setFormula] = useState(String.raw`\sum_{k=1}^{n}k=\frac{n(n+1)}{2}`);
  const [steps, setSteps] = useState([
    String.raw`将 $x^2-5x+6=0$ 分解为 $(x-2)(x-3)=0$。`,
    String.raw`由零乘积性质得到 $x-2=0$ 或 $x-3=0$。`,
    String.raw`因此 $x\in\{2,3\}$。`,
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
              <span className="demo-card__spec">TipTap / 节点</span>
            </header>
            <h2>TipTap inline/block 数学节点</h2>
            <TipTapMathDemo />
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">05</span>
              <span className="demo-card__spec">步骤 / 合并</span>
            </header>
            <h2>分步答案编辑器</h2>
            <AnswerStepsEditor onChange={setSteps} steps={steps} />
          </article>
        </div>
      </section>

      <footer className="demo-footer">
        <p>EquaKit · MIT License</p>
      </footer>
    </main>
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

function TipTapMathDemo() {
  const editor = useEditor({
    content: String.raw`
      <p>质能关系：<span data-type="inline-math" data-latex="E=mc^2"></span></p>
      <div data-type="block-math" data-latex="\int_{-\infty}^{\infty}e^{-x^2}\,\mathrm{d}x=\sqrt{\pi}"></div>
    `,
    editorProps: {
      attributes: {
        'aria-label': 'TipTap 数学编辑器',
        'aria-multiline': 'true',
        class: 'demo-tiptap__editor',
        role: 'textbox',
      },
    },
    extensions: [StarterKit, ...tipTapMathExtensions],
    immediatelyRender: false,
  });

  return (
    <div className="demo-tiptap">
      <div className="demo-actions" role="toolbar" aria-label="TipTap 数学节点操作">
        <button
          disabled={!editor}
          onClick={() => {
            if (!editor) return;
            const paragraphEnd = Math.max(1, (editor.state.doc.firstChild?.nodeSize ?? 2) - 1);
            const inserted = editor.commands.insertInlineMath({
              latex: '\\sqrt{x}',
              pos: paragraphEnd,
            });
            if (inserted) editor.commands.focus();
          }}
          type="button"
        >
          插入行内公式
        </button>
        <button
          disabled={!editor}
          onClick={() => {
            if (!editor) return;
            const inserted = editor.commands.insertBlockMath({
              latex: '\\sum_{i=1}^{n} i',
              pos: editor.state.doc.content.size,
            });
            if (inserted) editor.commands.focus();
          }}
          type="button"
        >
          插入块级公式
        </button>
        <button
          disabled={!editor}
          onClick={() => {
            if (!editor) return;
            editor.commands.setContent('<p>价格 $100$，旧公式 $a+b$。</p>');
            migrateEquaKitMathStrings(editor);
          }}
          type="button"
        >
          迁移旧公式文本
        </button>
      </div>
      <MathCopyBoundary options={TIPTAP_MATH_CLIPBOARD_OPTIONS}>
        <EditorContent editor={editor} />
      </MathCopyBoundary>
    </div>
  );
}
