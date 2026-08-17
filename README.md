# EquaKit

> 面向数学富文本渲染、复制与答案编辑的 TypeScript 工具集。

EquaKit 提供一个与框架无关的核心包，以及一个可选的 React 组件包。它专注于数学内容在
“源码 → 渲染 → 复制 → 再编辑”链路中的可靠性，同时提供分步答案编辑、选择题判分和异步过期响应保护。

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

| 包               | 职责                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `@equakit/core`  | 数学归一化、校验、剪贴板恢复、答案步骤、选择题判分、异步过期保护。    |
| `@equakit/react` | KaTeX/Markdown 渲染、公式输入、可访问选择题、分步答案编辑和复制边界。 |
| `@equakit/demo`  | 使用合成数据展示完整交互链路的 Vite 示例。                            |

```text
EquaKit
├── packages/core        # 与框架无关的 TypeScript 核心
├── packages/react       # 受控 React 组件
├── examples/basic       # 交互示例
├── docs                 # 设计、脱敏、安全和发布文档
└── scripts              # 发布包与 ESM 入口验证
```

## 快速开始

### 当前仓库内使用

```bash
pnpm install
pnpm check
```

单独构建某个包：

```bash
pnpm --filter @equakit/core build
pnpm --filter @equakit/react build
pnpm --filter @equakit/demo build
```

> npm 包尚未公开发布。许可证和 registry scope 确认后，安装命令预计为
> `pnpm add @equakit/core` 或 `pnpm add @equakit/react`。

## Core 使用示例

### 归一化与校验数学内容

```ts
import { normalizeMarkdownMath, validateMarkdownMath } from '@equakit/core';

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
import { richDomToMarkdown, richSelectionToMarkdown } from '@equakit/core';

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
} from '@equakit/core';

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
import { gradeChoiceAnswer, parseChoiceAnswer } from '@equakit/core';

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
import { StaleResponseGuard } from '@equakit/core';

const guard = new StaleResponseGuard<string>();

guard.setScope('question-1');
const snapshot = guard.begin('grade-answer');
const response = await gradeAnswer();

if (guard.isCurrent(snapshot)) {
  applyGrade(response);
}
```

## React 使用示例

先引入 KaTeX 和组件样式：

```ts
import 'katex/dist/katex.min.css';
import '@equakit/react/styles.css';
```

### 安全渲染 Markdown 数学内容

```tsx
import { MarkdownMath, MathCopyBoundary } from '@equakit/react';

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
import { FormulaInput } from '@equakit/react';

export function FormulaEditor() {
  const [value, setValue] = useState(String.raw`\frac{1}{2}`);

  return <FormulaInput value={value} onChange={setValue} />;
}
```

### 分步答案编辑

```tsx
import { useState } from 'react';
import { AnswerStepsEditor } from '@equakit/react';

export function SolutionEditor() {
  const [steps, setSteps] = useState(['展开多项式。', '合并同类项。']);

  return <AnswerStepsEditor steps={steps} onChange={setSteps} />;
}
```

### 可访问选择题

```tsx
import { useState } from 'react';
import { InteractiveChoices } from '@equakit/react';

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

- 使用 [KaTeX](https://github.com/KaTeX/KaTeX) 作为默认渲染和校验基础；
- 使用 [react-markdown](https://github.com/remarkjs/react-markdown)、
  [remark-math](https://github.com/remarkjs/remark-math) 和
  [rehype-katex](https://github.com/remarkjs/remark-math) 作为 Markdown 数学管线；
- 计划以可选 adapter 方式接入 [MathLive](https://github.com/arnog/mathlive)，而不是增加默认包体积；
- 计划为 [TipTap Mathematics](https://tiptap.dev/docs/editor/extensions/nodes/mathematics)
  提供 inline/block math node 适配；
- AST 级处理将作为可选的 [unified-latex](https://github.com/siefkenj/unified-latex) 集成，
  不进入默认运行时。

## 工程质量

当前校验覆盖：

- Prettier 格式检查；
- ESLint 静态检查；
- TypeScript 类型检查；
- 42 个 Vitest 测试；
- core、React 和 Demo 构建；
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
- 支持 SSR；
- 富文本选区恢复依赖浏览器的 `DOMParser`、`Selection` 和 `Range`；
- 浏览器 API 不可用时自动回退为规范化纯文本。

## 路线图

- [x] 添加 MIT License；
- [ ] 确认 GitHub 与 npm scope 元数据；
- [ ] 增加真实浏览器复制、光标、IME 和无障碍测试；
- [ ] 为 `FormulaInput` 增加可选 MathLive adapter；
- [ ] 提供 TipTap inline/block math node adapter；
- [ ] 增加 LaTeX、MathML、AsciiMath、MathJSON 多格式剪贴板输出；
- [ ] 增加自动 API 文档和在线 playground；
- [ ] 评估升级到 KaTeX `0.18.x` 并执行视觉回归。

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
