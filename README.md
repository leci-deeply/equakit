# EquaKit

> 面向数学富文本渲染、复制与答案编辑的 TypeScript 工具集。

[在线 Playground](https://leci-deeply.github.io/equakit/) ·
[API 文档](https://leci-deeply.github.io/equakit/api/) ·
[GitHub](https://github.com/leci-deeply/equakit)

EquaKit 现在由 16 个原子包和 4 个兼容重导出包组成。文档和示例默认直接面向原子包，
旧的 `@equakit/core`、`@equakit/react`、`@equakit/adapter-mathlive`、`@equakit/adapter-tiptap`
只保留兼容重导出，方便迁移，不再作为新的能力边界。

## 为什么需要 EquaKit

数学内容在普通富文本工具中经常遇到这些问题：

- 从 KaTeX 或 MathML 页面复制公式时，只得到视觉字符，无法恢复规范 LaTeX；
- LLM、OCR 和历史内容产生的 `\(...\)`、`\[...\]`、`$$...$$` 分隔符不稳定；
- 不完整公式在编辑阶段容易导致预览崩溃或空白；
- 分步答案在 Backspace/Delete 边界操作时容易误合并、误删除；
- 单选、多选和展示型答案的判分口径容易不一致；
- 异步保存或判分结果可能覆盖已经切换后的新状态。

EquaKit 将这些问题拆成纯函数、受控组件和明确的安全边界，而不是绑定到某个业务系统或后端接口。

## 核心能力

### 数学源码处理

- 归一化 Markdown 和 LaTeX 数学分隔符；
- 修复常见的块级公式换行问题；
- 避免把普通中英文文本误识别成整段公式；
- 使用 KaTeX 返回结构化校验结果；
- 提取行内和块级数学 token 及源码位置。

### 数学富文本复制

- 从渲染后的 DOM、HTML 或当前选区恢复 Markdown + LaTeX；
- 默认读取 `data-math-source`，也支持自定义属性和 decoder；
- 无标记时回退读取 MathML 的 `application/x-tex` annotation；
- 保留粗体、斜体、列表和块级换行；
- 默认排除脚本、样式和视觉层 KaTeX MathML 副本。

### 答案编辑

- 将 OCR、上传答案或自由文本转换为稳定步骤；
- 支持步骤拆分、前向合并、后向合并；
- 第一次边界删除进入待确认状态，第二次才执行合并；
- 提供受控的 React 分步答案编辑器。

### 选择题判分

- 支持 A-H 单选和多选；
- 兼容大小写、括号、顿号、逗号、空格和展示型 LaTeX；
- 多选答案顺序无关；
- 返回 `missing`、`extra`、`selected`、`expected` 等结构化结果。

### 异步安全

- 按资源键维护 mutation version；
- 支持作用域快照；
- 拒绝旧请求、旧页面或旧资源返回的异步结果；
- `clear()` 使用 tombstone 递增，不会让旧版本重新变成有效版本。

## 包结构

### 原子包

| 包                             | 职责                                                   |
| ------------------------------ | ------------------------------------------------------ |
| `@equakit/answer-steps`        | 分步答案文本解析、格式化与边界删除状态机。             |
| `@equakit/async-guard`         | 按资源键和 scope 拒绝过期异步结果。                    |
| `@equakit/choice`              | A-H 选择题答案解析、转换与判分。                       |
| `@equakit/math-text`           | 数学分隔符归一化、启发式识别和 token 提取。            |
| `@equakit/katex-engine`        | 基于 KaTeX 的 LaTeX 校验和结构化问题输出。             |
| `@equakit/clipboard-restore`   | 从富数学 HTML、DOM 和选区恢复 Markdown/LaTeX。         |
| `@equakit/clipboard-formats`   | 生成多格式数学剪贴板 payload。                         |
| `@equakit/react-katex`         | 安全渲染单个 LaTeX 公式。                              |
| `@equakit/react-markdown-math` | 安全渲染 GFM + 数学内容。                              |
| `@equakit/react-formula-input` | 受控公式输入、公式面板、预览与校验。                   |
| `@equakit/react-clipboard`     | 数学内容复制、选区序列化和多 MIME 写入。               |
| `@equakit/react-answer-steps`  | 分步答案编辑和键盘边界交互。                           |
| `@equakit/react-choice`        | 可访问单选和多选数学选项。                             |
| `@equakit/mathlive-editor`     | 可选 MathLive 数学输入器。                             |
| `@equakit/mathlive-formats`    | 基于 MathLive 与 Compute Engine 的多格式剪贴板转换器。 |
| `@equakit/tiptap-math`         | TipTap 3 数学节点配置、剪贴板选项和迁移。              |

### 兼容包

| 包                          | 说明                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@equakit/core`             | 兼容重导出 `math-text`、`katex-engine`、`clipboard-restore`、`clipboard-formats`、`answer-steps`、`choice` 和 `async-guard`。       |
| `@equakit/react`            | 兼容重导出 `react-katex`、`react-markdown-math`、`react-formula-input`、`react-clipboard`、`react-answer-steps` 和 `react-choice`。 |
| `@equakit/adapter-mathlive` | 兼容重导出 `mathlive-editor`，并保留 `./clipboard` 子入口。                                                                         |
| `@equakit/adapter-tiptap`   | 兼容重导出 `tiptap-math`。                                                                                                          |

```text
EquaKit
├── packages/answer-steps
├── packages/async-guard
├── packages/choice
├── packages/math-text
├── packages/katex-engine
├── packages/clipboard-restore
├── packages/clipboard-formats
├── packages/react-katex
├── packages/react-markdown-math
├── packages/react-formula-input
├── packages/react-clipboard
├── packages/react-answer-steps
├── packages/react-choice
├── packages/mathlive-editor
├── packages/mathlive-formats
├── packages/tiptap-math
├── packages/core                # 兼容重导出
├── packages/react               # 兼容重导出
├── packages/adapter-mathlive    # 兼容重导出
├── packages/adapter-tiptap      # 兼容重导出
├── examples/basic               # 直接使用 atomic packages 的演示
├── docs                         # 设计、技术、依赖和发布文档
└── scripts                      # 边界、pack 和站点校验
```

## 快速开始

### 当前仓库内使用

```bash
pnpm install
pnpm exec playwright install chromium
pnpm check
```

单独构建某个包：

```bash
pnpm --filter @equakit/math-text build
pnpm --filter @equakit/react-katex build
pnpm --filter @equakit/mathlive-editor build
pnpm --filter @equakit/tiptap-math build
```

> 当前仓库内 20 个 package 都仍是 `private: true`，尚未发布到 npm。仓库外集成时，请按需引入
> atomic packages；旧包只用于迁移兼容。

## 原子包使用示例

### 数学文本归一化与校验

```ts
import { normalizeMarkdownMath } from '@equakit/math-text';
import { validateMarkdownMath } from '@equakit/katex-engine';

const source = String.raw`
函数值为 \(f(x)=x^2+1\)。

\[\int_0^1 x^2\,\mathrm{d}x=\frac{1}{3}\]
`;

const normalized = normalizeMarkdownMath(source);
const result = validateMarkdownMath(normalized);

if (!result.ok) {
  console.error(result.issues);
}
```

### 从渲染内容恢复 LaTeX

渲染公式时，把规范化源码放在中性属性中：

```html
<span class="katex" data-math-source="\frac{a}{b}">...</span>
```

复制或框选后恢复为可编辑 Markdown：

```ts
import { richDomToMarkdown, richSelectionToMarkdown } from '@equakit/clipboard-restore';

const all = richDomToMarkdown(editorRoot, editorRoot.textContent ?? '');

const selected = richSelectionToMarkdown(selection.getRangeAt(0), editorRoot, selection.toString());
```

如果宿主使用了不同的属性名：

```ts
const markdown = richDomToMarkdown(root, plainText, {
  mathSourceAttribute: 'data-latex',
  decodeMathSource: decodeURIComponent,
});
```

### 分步答案

```ts
import {
  formatStepAnswer,
  mergeStepWithPrevious,
  stepBoundaryDeletionAction,
  stepTextToLines,
} from '@equakit/answer-steps';

const steps = stepTextToLines('1. 设 x = 1\n2. 所以 x^2 = 1');
const text = formatStepAnswer({ steps });

const action = stepBoundaryDeletionAction({
  key: 'Backspace',
  selectionCollapsed: true,
  atStepBoundary: true,
  targetAlreadyArmed: false,
});

const merged = action === 'merge' ? mergeStepWithPrevious(steps, 1) : steps;
```

### 选择题判分

```ts
import { gradeChoiceAnswer, parseChoiceAnswer } from '@equakit/choice';

const expected = parseChoiceAnswer('正确答案：A、C');

if (expected) {
  const result = gradeChoiceAnswer([2, 0], expected);
  console.log(result.correct); // true
  console.log(result.missing); // []
  console.log(result.extra); // []
}
```

### 防止旧异步结果覆盖新状态

```ts
import { StaleResponseGuard } from '@equakit/async-guard';

const guard = new StaleResponseGuard<string>();

guard.setScope('question-1');
const snapshot = guard.begin('grade-answer');
const response = await gradeAnswer();

if (guard.isCurrent(snapshot)) {
  applyGrade(response);
}
```

## React 使用示例

按需引入对应样式：

```ts
import 'katex/dist/katex.min.css';
import '@equakit/react-katex/styles.css';
import '@equakit/react-markdown-math/styles.css';
import '@equakit/react-formula-input/styles.css';
import '@equakit/react-clipboard/styles.css';
import '@equakit/react-answer-steps/styles.css';
import '@equakit/react-choice/styles.css';
```

### 安全渲染 Markdown 数学内容

```tsx
import { MathCopyBoundary } from '@equakit/react-clipboard';
import { MarkdownMath } from '@equakit/react-markdown-math';

export function Article() {
  return (
    <MathCopyBoundary>
      <MarkdownMath>{'当 $f(x)=x^2$ 时，$f(2)=4$。'}</MarkdownMath>
    </MathCopyBoundary>
  );
}
```

`MarkdownMath` 默认不启用原始 HTML，并拒绝不安全 URL 协议。

### 公式输入

```tsx
import { useState } from 'react';
import { FormulaInput } from '@equakit/react-formula-input';

export function FormulaEditor() {
  const [value, setValue] = useState(String.raw`\frac{1}{2}`);

  return <FormulaInput value={value} onChange={setValue} />;
}
```

### MathLive 可选输入

```tsx
import 'mathlive/fonts.css';

import { useState } from 'react';
import { MathLiveFormulaEditor } from '@equakit/mathlive-editor';
import { FormulaInput } from '@equakit/react-formula-input';

export function RichFormulaEditor() {
  const [value, setValue] = useState(String.raw`\frac{1}{2}`);

  return <FormulaInput editor={MathLiveFormulaEditor} onChange={setValue} value={value} />;
}
```

MathLive 不进入主包，只有导入 `@equakit/mathlive-editor` 后才会在浏览器动态加载。兼容重导出
`@equakit/adapter-mathlive` 仍可用于旧代码迁移。高级配置、字体资源和安全版本要求见
[`packages/mathlive-editor/README.md`](packages/mathlive-editor/README.md)。

### TipTap inline/block 数学节点

```ts
import StarterKit from '@tiptap/starter-kit';
import { createTipTapMathExtensions } from '@equakit/tiptap-math';

const extensions = [StarterKit, ...createTipTapMathExtensions()];
```

`@equakit/tiptap-math` 复用 TipTap 官方 `inlineMath` / `blockMath` schema 和命令，固定安全 KaTeX
默认值，并通过 `TIPTAP_MATH_CLIPBOARD_OPTIONS` 接入 EquaKit 数学复制。兼容重导出
`@equakit/adapter-tiptap` 仍可用于旧代码迁移。

### 多格式公式复制

```tsx
import { MathCopyBoundary } from '@equakit/react-clipboard';
import { MathFormula } from '@equakit/react-katex';
import { createMathLiveClipboardConverter } from '@equakit/mathlive-formats';

const converter = createMathLiveClipboardConverter();

<MathCopyBoundary converter={converter}>
  <MathFormula expression={'\\frac{1}{2}'} />
</MathCopyBoundary>;
```

选区只有一个公式时会同时写入：

- `text/plain`：带数学分隔符的可编辑文本；
- `application/x-latex`：纯 LaTeX；
- `application/mathml+xml`：带标准命名空间的完整 MathML；
- `text/asciimath`：AsciiMath；
- `application/vnd.equakit.mathjson+json`：MathJSON。

混合正文或多个公式时只写入 `text/plain`，不会把整段内容错误转换成单个表达式。MathML 是
IANA 注册类型；其余数学 MIME 是兼容或 EquaKit 私有格式，可能被原生应用过滤。

### 分步答案编辑

```tsx
import { useState } from 'react';
import { AnswerStepsEditor } from '@equakit/react-answer-steps';

export function SolutionEditor() {
  const [steps, setSteps] = useState(['展开多项式。', '合并同类项。']);

  return <AnswerStepsEditor steps={steps} onChange={setSteps} />;
}
```

### 可访问选择题

```tsx
import { useState } from 'react';
import { InteractiveChoices } from '@equakit/react-choice';

export function ChoiceExample() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <InteractiveChoices
      choices={['$x=1$', '$x=2$', '$x=3$']}
      selected={selected}
      onChange={setSelected}
      correct={['1']}
      reveal={selected.length > 0}
    />
  );
}
```

## 安全设计

- `MarkdownMath` 不启用 `rehype-raw`；
- KaTeX 使用 `trust: false`；
- `dangerouslySetInnerHTML` 只接收 KaTeX 生成结果；
- URL 只允许明确协议；
- 自定义剪贴板 selector 无效时回退到默认安全规则；
- 自定义数学源码属性名必须符合安全属性名格式；
- 发布检查会真实打包 tarball，并验证 ESM 入口和 workspace 协议转换；
- `pnpm audit --audit-level moderate` 当前无已知漏洞。

详见 [SECURITY.md](SECURITY.md) 和 [docs/DESIGN.md](docs/DESIGN.md)。

## 与现有开源项目的关系

EquaKit 不试图替代完整数学编辑器，而是提供轻量、可组合的基础能力：

- 使用 [KaTeX](https://github.com/KaTeX/KaTeX) `0.18.4` 作为默认渲染和校验基础；
- 使用 [react-markdown](https://github.com/remarkjs/react-markdown)、
  [remark-math](https://github.com/remarkjs/remark-math) 和
  [rehype-katex](https://github.com/remarkjs/remark-math) 作为 Markdown 数学管线；
- 已用独立可选的 `@equakit/mathlive-editor` 接入 [MathLive](https://github.com/arnog/mathlive)，
  不增加 React 主包体积；兼容重导出 `@equakit/adapter-mathlive` 仍保留用于旧代码迁移；
- 已为 [TipTap Mathematics](https://tiptap.dev/docs/editor/extensions/nodes/mathematics)
  提供 `@equakit/tiptap-math` 的 inline/block math node、迁移和剪贴板适配；兼容重导出
  `@equakit/adapter-tiptap` 仍保留用于旧代码迁移；
- AST 级处理将作为可选的 [unified-latex](https://github.com/siefkenj/unified-latex) 集成，
  不进入默认运行时。

## 工程质量

当前校验覆盖：

- Prettier 格式检查；
- ESLint 静态检查；
- TypeScript 类型检查；
- 65 个 Vitest 测试；
- 11 个 Playwright Chromium 测试，覆盖 KaTeX 截图回归、站点导航、多 MIME 复制、光标、IME、MathLive、TipTap、键盘和 axe 无障碍扫描，且视觉截图回归完全一致；
- TypeDoc 多入口 API 校验；
- Playground + API 静态站点构建、相对路径和脱敏验证；
- 原子包、兼容包和 Demo 构建；
- 构建后 ESM 入口动态导入；
- npm tarball 文件白名单与 workspace 协议检查；
- 生产依赖许可证清单；
- 依赖漏洞、敏感名称、凭据、域名和 IP 扫描。

运行完整校验：

```bash
pnpm check
```

## 兼容性

- 发布目标：ES2022 ESM；
- 开发环境：Node.js 22+、pnpm 10；
- React：18；
- KaTeX：`0.18.4`，通过 workspace override 保证 rehype/TipTap 使用同一版本；
- 支持 SSR；
- 富文本选区恢复依赖浏览器的 `DOMParser`、`Selection` 和 `Range`；
- 浏览器 API 不可用时自动回退为规范化纯文本。

## 路线图

- [x] 添加 MIT License；
- [x] 创建 npm `equakit` 组织并校准 GitHub 与包清单元数据；
- [x] 增加真实浏览器复制、光标、IME 和无障碍测试；
- [x] 为 `FormulaInput` 增加可选 MathLive editor；
- [x] 提供 TipTap inline/block math package；
- [x] 增加 LaTeX、MathML、AsciiMath、MathJSON 多格式剪贴板输出；
- [x] 增加自动 API 文档和在线 playground；
- [x] 升级到 KaTeX `0.18.4` 并执行持续视觉回归。

## 文档

- [技术实现与技术选型说明](docs/TECHNICAL_GUIDE.md)
- [设计与包边界](docs/DESIGN.md)
- [安全策略](SECURITY.md)
- [脱敏记录](docs/REDACTION.md)
- [生产依赖许可证](docs/DEPENDENCIES.md)
- [发布检查清单](docs/PUBLICATION_CHECKLIST.md)
- [贡献指南](CONTRIBUTING.md)

## 作者

**leci**

GitHub：<https://github.com/leci-deeply>

## 许可证

EquaKit 使用 [MIT License](LICENSE)。

```text
Copyright (c) 2026 leci
```

在保留版权声明和许可证文本的前提下，可以使用、复制、修改、合并、发布、分发、再授权和销售本软件。
