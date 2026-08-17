import { useMemo, useState } from 'react';

import { MathLiveFormulaEditor } from '@equakit/adapter-mathlive';
import {
  TIPTAP_MATH_CLIPBOARD_OPTIONS,
  createTipTapMathExtensions,
  migrateEquaKitMathStrings,
} from '@equakit/adapter-tiptap';
import {
  AnswerStepsEditor,
  FormulaInput,
  InteractiveChoices,
  MarkdownMath,
  MathCopyBoundary,
  MathFormula,
} from '@equakit/react';
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
      </header>

      <section className="demo-grid">
        <article className="demo-card demo-card--wide">
          <h2>Markdown 与复制恢复</h2>
          <MathCopyBoundary>
            <MarkdownMath>{explanation}</MarkdownMath>
          </MathCopyBoundary>
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
