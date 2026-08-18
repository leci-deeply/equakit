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
    <main className="demo-shell">
      <header className="demo-hero">
        <p className="demo-eyebrow">框架安全的数学内容编写</p>
        <h1>EquaKit</h1>
        <p>一个中性的示例，展示数学渲染、公式编写、可访问答案和规范化复制行为。</p>
        <nav className="demo-links" aria-label="项目链接">
          <a href={`${import.meta.env.BASE_URL}api/`}>API 文档</a>
          <a href="https://github.com/leci-deeply/equakit">GitHub</a>
        </nav>
      </header>

      <section className="demo-grid">
        <article className="demo-card demo-card--wide">
          <h2>Markdown 与复制恢复</h2>
          <MathCopyBoundary>
            <MarkdownMath>{explanation}</MarkdownMath>
          </MathCopyBoundary>
        </article>

        <article className="demo-card demo-card--wide">
          <h2>多格式公式复制</h2>
          <p>选中公式后复制，同时提供 LaTeX、MathML、AsciiMath 和 MathJSON。</p>
          <MultiFormatCopyDemo />
        </article>

        <article className="demo-card demo-card--wide">
          <h2>KaTeX 视觉回归矩阵</h2>
          <p>覆盖分式、根式、定界符、矩阵、极限、积分、字体和上下标布局。</p>
          <KaTeXVisualMatrix />
        </article>

        <article className="demo-card">
          <h2>公式输入</h2>
          <FormulaInput onChange={setFormula} value={formula} />
          <div className="demo-result">
            <MathFormula display expression={formula} />
          </div>
        </article>

        <article className="demo-card">
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

        <article className="demo-card demo-card--wide">
          <h2>TipTap inline/block 数学节点</h2>
          <p>节点保存 LaTeX 属性，使用官方命令编辑，并接入 EquaKit 数学剪贴板。</p>
          <TipTapMathDemo />
        </article>

        <article className="demo-card">
          <h2>可访问的选择题</h2>
          <InteractiveChoices
            choices={['$x=1$', '$x=2$', '$x=3$']}
            correct={correct}
            onChange={setSelected}
            reveal={selected.length > 0}
            selected={selected}
          />
        </article>

        <article className="demo-card demo-card--wide">
          <h2>分步答案编辑器</h2>
          <p>
            在分步边界处，第一次按 Backspace/Delete
            会进入合并待确认状态，第二次才真正合并，从而避免误删。
          </p>
          <AnswerStepsEditor onChange={setSteps} steps={steps} />
        </article>
      </section>
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
          onClick={() =>
            editor?.chain().focus('end').insertInlineMath({ latex: '\\sqrt{x}' }).run()
          }
          type="button"
        >
          插入行内公式
        </button>
        <button
          disabled={!editor}
          onClick={() =>
            editor?.chain().focus('end').insertBlockMath({ latex: '\\sum_{i=1}^{n} i' }).run()
          }
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
