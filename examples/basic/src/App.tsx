import { useEffect, useMemo, useState } from 'react';

import type { MathClipboardFormatConverter } from '@equakit/clipboard-formats';
import { MathLiveFormulaEditor } from '@equakit/mathlive-editor';
import { AnswerStepsEditor } from '@equakit/react-answer-steps';
import { InteractiveChoices } from '@equakit/react-choice';
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

const explanation = String.raw`
## 安全的数学富文本工作流

渲染器可以接受 Markdown 和 LaTeX，例如 $f(x)=x^2+1$，并且默认不会启用原始 HTML。

$$
\int_0^1 x^2\,\mathrm{d}x=\frac{1}{3}
$$

选中并复制这段内容时，复制边界会保留规范化的 LaTeX，而不是视觉字形。
`;

const heroSpecimen = String.raw`\frac{-b\pm\sqrt{b^2-4ac}}{2a}`;
const tallFormula = String.raw`\int\limits_{-\infty}^{+\infty}\sqrt{\frac{x^2+1}{x^2+2}}\,\mathrm{d}x`;
const longFormula = String.raw`\displaystyle \sum_{k=1}^{n}\frac{(-1)^{k+1}}{k}\left(\prod_{j=1}^{m}\frac{x_j^2+a_j^2}{\sqrt{x_j^2+b_j^2}}\right)=\int_{0}^{\infty}\frac{\sin(tx)}{1+t^2}\,\mathrm{d}t`;

export function App() {
  const [formula, setFormula] = useState(String.raw`\frac{-b\pm\sqrt{b^2-4ac}}{2a}`);
  const [mathLiveFormula, setMathLiveFormula] = useState(String.raw`x^2+1`);
  const [steps, setSteps] = useState([
    String.raw`展开 $(x+1)^2=x^2+2x+1$。`,
    String.raw`合并同类项并求出 $x$。`,
  ]);
  const [selected, setSelected] = useState<string[]>([]);
  const correct = useMemo(() => ['1'], []);

  return (
    <main className="demo-shell" id="main-content" tabIndex={-1}>
      <a className="demo-skip-link" href="#demo-collection">
        跳到功能矩阵
      </a>

      <header className="demo-topbar">
        <a className="demo-brand" href="#main-content" aria-label="返回页面顶部">
          <span className="demo-brand__mark">EQK</span>
          <span className="demo-brand__name">EquaKit Playground</span>
        </a>

        <nav className="demo-links" aria-label="项目链接">
          <a href={`${import.meta.env.BASE_URL}api/`}>API 文档</a>
          <a href="https://github.com/leci-deeply/equakit">GitHub</a>
        </nav>
      </header>

      <section className="demo-hero" aria-labelledby="demo-title">
        <div className="demo-hero__copy">
          <p className="demo-eyebrow">数学工具 / Playground / 文档同构</p>
          <h1 id="demo-title">EquaKit</h1>
          <p className="demo-hero__lede">
            从 LaTeX 规范化到编辑器接入，让数学内容始终保持为可渲染、可复制、
            可继续编辑的结构化文本。
          </p>
          <div className="demo-hero__chips" aria-label="页面特征">
            <span className="demo-chip">16 个原子包</span>
            <span className="demo-chip">5 种剪贴板格式</span>
            <span className="demo-chip">SSR 安全</span>
            <span className="demo-chip">无障碍优先</span>
          </div>
        </div>

        <aside className="demo-hero__panel" aria-label="示例仪表板">
          <div className="demo-specimen">
            <div className="demo-specimen__top">
              <span className="demo-specimen__label">首屏样本</span>
              <span className="demo-specimen__badge">LaTeX / Markdown</span>
            </div>
            <div className="demo-specimen__formula">
              <MathFormula display expression={heroSpecimen} />
            </div>
            <p className="demo-specimen__caption">
              同一份 LaTeX 数据贯穿输入、渲染、复制与编辑流程，不被视觉字形取代。
            </p>
          </div>

          <ul className="demo-hero__facts" aria-label="关键规格">
            <li>
              <strong>16</strong>
              <span>个原子能力包</span>
            </li>
            <li>
              <strong>3</strong>
              <span>种浏览器验证</span>
            </li>
            <li>
              <strong>65</strong>
              <span>项单元验证</span>
            </li>
          </ul>
        </aside>
      </section>

      <section
        className="demo-collection"
        id="demo-collection"
        aria-labelledby="demo-collection-title"
      >
        <div className="demo-collection__head">
          <p className="demo-collection__eyebrow">功能矩阵</p>
          <h2 id="demo-collection-title" className="demo-collection__title">
            安全默认的数学富文本工作台
          </h2>
          <p className="demo-collection__lede">
            按渲染、复制、输入、编辑与作答能力拆分，每个示例都可直接操作并对应独立的软件包。
          </p>
        </div>

        <div className="demo-grid">
          <article className="demo-card demo-card--span-7">
            <header className="demo-card__header">
              <span className="demo-card__index">01</span>
              <span className="demo-card__spec">复制 / Markdown</span>
            </header>
            <h2>Markdown 与复制恢复</h2>
            <MathCopyBoundary>
              <MarkdownMath>{explanation}</MarkdownMath>
            </MathCopyBoundary>
          </article>

          <article className="demo-card demo-card--span-5">
            <header className="demo-card__header">
              <span className="demo-card__index">02</span>
              <span className="demo-card__spec">多 MIME / 剪贴板</span>
            </header>
            <h2>多格式公式复制</h2>
            <p>选中公式后复制，同时提供 LaTeX、MathML、AsciiMath 和 MathJSON。</p>
            <MultiFormatCopyDemo />
          </article>

          <article className="demo-card demo-card--span-12">
            <header className="demo-card__header">
              <span className="demo-card__index">03</span>
              <span className="demo-card__spec">视觉回归 / KaTeX</span>
            </header>
            <h2>KaTeX 视觉回归矩阵</h2>
            <p>覆盖分式、根式、定界符、矩阵、极限、积分、字体和上下标布局。</p>
            <KaTeXVisualMatrix />
            <FormulaLayoutDemos />
          </article>

          <article className="demo-card demo-card--span-4">
            <header className="demo-card__header">
              <span className="demo-card__index">04</span>
              <span className="demo-card__spec">输入 / 预览</span>
            </header>
            <h2>公式输入</h2>
            <FormulaInput onChange={setFormula} value={formula} />
            <div className="demo-result">
              <MathFormula display expression={formula} />
            </div>
          </article>

          <article className="demo-card demo-card--span-4">
            <header className="demo-card__header">
              <span className="demo-card__index">05</span>
              <span className="demo-card__spec">MathLive / 可选</span>
            </header>
            <h2>MathLive 可选输入</h2>
            <p>主包保持轻量，按需安装 adapter 后可以切换为结构化数学输入器。</p>
            <FormulaInput
              editor={MathLiveFormulaEditor}
              onChange={setMathLiveFormula}
              previewLabel="MathLive 预览"
              textareaLabel="MathLive 公式源码"
              value={mathLiveFormula}
            />
          </article>

          <article className="demo-card demo-card--span-4">
            <header className="demo-card__header">
              <span className="demo-card__index">06</span>
              <span className="demo-card__spec">TipTap / 节点</span>
            </header>
            <h2>TipTap inline/block 数学节点</h2>
            <p>节点保存 LaTeX 属性，使用官方命令编辑，并接入 EquaKit 数学剪贴板。</p>
            <TipTapMathDemo />
          </article>

          <article className="demo-card demo-card--span-5">
            <header className="demo-card__header">
              <span className="demo-card__index">07</span>
              <span className="demo-card__spec">练习 / 交互</span>
            </header>
            <h2>可访问的选择题</h2>
            <InteractiveChoices
              choices={['$x=1$', '$x=2$', '$x=3$']}
              correct={correct}
              onChange={setSelected}
              reveal={selected.length > 0}
              selected={selected}
            />
          </article>

          <article className="demo-card demo-card--span-7">
            <header className="demo-card__header">
              <span className="demo-card__index">08</span>
              <span className="demo-card__spec">步骤 / 合并</span>
            </header>
            <h2>分步答案编辑器</h2>
            <p>
              在分步边界处，第一次按 Backspace/Delete 会进入合并待确认状态，第二次才真正合并，
              从而避免误删。
            </p>
            <AnswerStepsEditor onChange={setSteps} steps={steps} />
          </article>
        </div>
      </section>

      <footer className="demo-footer">
        <p>EquaKit · 数学富文本复制、渲染与答案编辑工具集。</p>
        <p>查看 API 文档了解接口，或前往 GitHub 阅读源码与集成示例。</p>
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
  return (
    <div className="demo-formula-layout" aria-label="公式布局验证">
      <section className="demo-formula-layout__sample" data-testid="formula-height-sample">
        <h3>高度自适应</h3>
        <MathFormula ariaLabel="高度自适应公式" display expression={tallFormula} />
        <p data-testid="formula-height-following">公式后的正文不会被上下标或根式覆盖。</p>
      </section>
      <section className="demo-formula-layout__sample" data-testid="formula-overflow-sample">
        <h3>超长公式滚动提示</h3>
        <MarkdownMath overflowIndicator="hover-scrollbar">{`$$${longFormula}$$`}</MarkdownMath>
      </section>
      <section
        className="demo-formula-layout__sample"
        data-testid="formula-default-overflow-sample"
      >
        <h3>默认滚动可访问</h3>
        <MarkdownMath>{`$$${longFormula}$$`}</MarkdownMath>
      </section>
      <section className="demo-formula-layout__sample" data-testid="formula-direct-overflow-sample">
        <h3>单公式滚动可访问</h3>
        <MathFormula ariaLabel="超长单公式" display expression={longFormula} />
      </section>
      <section className="demo-formula-layout__sample" data-testid="formula-short-sample">
        <h3>短公式保持干净</h3>
        <MarkdownMath overflowIndicator="hover-scrollbar">{'$x^2+y^2=z^2$'}</MarkdownMath>
      </section>
    </div>
  );
}

function MultiFormatCopyDemo() {
  const [converter, setConverter] = useState<MathClipboardFormatConverter | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

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
    <>
      <span className="mre-visually-hidden" role="status">
        多格式转换器已加载。
      </span>
      <MathCopyBoundary converter={converter}>
        <div aria-label="多格式复制公式" role="group">
          <MathFormula ariaLabel="二分之一" display expression={'\\frac{1}{2}'} />
        </div>
      </MathCopyBoundary>
    </>
  );
}

function TipTapMathDemo() {
  const editor = useEditor({
    content: String.raw`
      <p>行内公式：<span data-type="inline-math" data-latex="x^2+1"></span></p>
      <div data-type="block-math" data-latex="\int_0^1 x^2\,\mathrm{d}x"></div>
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
