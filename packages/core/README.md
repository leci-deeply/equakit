# @equakit/core

> 兼容聚合包：当前包不再保存业务实现，只显式重导出七个无框架原子技能。新项目建议按需安装
> `@equakit/math-text`、`@equakit/katex-engine`、`@equakit/clipboard-restore`、
> `@equakit/clipboard-formats`、`@equakit/answer-steps`、`@equakit/choice` 或
> `@equakit/async-guard`；旧导入路径继续兼容。

面向数学富文本编辑器的无框架 TypeScript 工具集。

这个包保持通用：不包含产品名、后端 API、特定学习场景概念或私有标记约定。它可以作为 React、Vue、Svelte、ProseMirror、Slate、Lexical 或纯 `contenteditable` 集成的核心层。

## 能力

- 在渲染前归一化 Markdown 和 LaTeX 数学分隔符。
- 从独立的 LaTeX 表达式中移除数学分隔符。
- 使用 KaTeX 校验行内和块级数学。
- 从富数学区域复制出来的渲染 DOM / HTML 中恢复 Markdown 和 LaTeX。
- 配置公式标记属性，默认值为 `data-math-source`。
- 将 OCR、上传内容或自由输入的答案文本转换成稳定的分步行。
- 使用“按两次 Backspace/Delete”状态机处理分步边界合并。
- 解析并判定 A-H 单选或多选答案。
- 使用带键的变更版本和可选作用域匹配来保护异步响应。

## 安装

```sh
pnpm add @equakit/core katex
```

KaTeX 是默认校验函数的运行时依赖。

## 数学归一化

```ts
import { normalizeMarkdownMath, validateMarkdownMath } from '@equakit/core';

const markdown = normalizeMarkdownMath(String.raw`
面积为 \(a^2\)。
\frac{1}{2} + \sqrt{x}
`);

const result = validateMarkdownMath(markdown);
if (!result.ok) {
  console.log(result.issues);
}
```

## 富剪贴板恢复

渲染公式时，请把源 LaTeX 挂到公式包裹节点上：

```html
<span class="katex" data-math-source="\frac{a}{b}">...</span>
```

然后就可以从复制的 HTML 或当前选区中恢复可编辑的 Markdown / LaTeX：

```ts
import { richHtmlToMarkdown, richSelectionToMarkdown } from '@equakit/core';

const markdown = richHtmlToMarkdown(
  event.clipboardData.getData('text/html'),
  event.clipboardData.getData('text/plain'),
);

const selected = richSelectionToMarkdown(range, editorRoot, selection.toString(), {
  mathSourceAttribute: 'data-latex',
  decodeMathSource: decodeURIComponent,
});
```

当没有标记属性时，序列化器还会回退到 MathML 注释，例如
`annotation[encoding="application/x-tex"]`。

如果富文本模型区分行内和块级数学，可以通过 `displayMathSelector` 指定块级公式节点。
匹配节点会输出独立一行的 `\\[...\\]`，其他公式继续输出 `\\(...\\)`。

## 多格式剪贴板 payload

```ts
import { createMathClipboardPayload } from '@equakit/core';

const payload = createMathClipboardPayload('\\(x^2+1\\)', {
  toMathML: (latex) => convertToMathML(latex),
  toAsciiMath: (latex) => convertToAsciiMath(latex),
  toMathJSON: (latex) => convertToMathJSON(latex),
});
```

core 始终生成 `text/plain`，并为单公式生成 `application/x-latex`。MathML、AsciiMath 和
MathJSON 通过同步 `MathClipboardFormatConverter` 注入，core 不绑定具体转换引擎。
混合正文或多公式选区只保留 `text/plain`。

## 分步答案辅助

```ts
import { formatStepAnswer, stepBoundaryDeletionAction, stepTextToLines } from '@equakit/core';

const lines = stepTextToLines('1. 令 x = 1\n2. 因此 x^2 = 1');
const text = formatStepAnswer({ steps: lines });

const action = stepBoundaryDeletionAction({
  key: 'Backspace',
  selectionCollapsed: true,
  atStepBoundary: true,
  targetAlreadyArmed: false,
});
```

`stepBoundaryDeletionAction` 的返回值含义如下：

- `none`：让编辑器正常处理事件。
- `arm`：阻止默认删除，并记住边界范围。
- `hold`：在同一个边界已被武装时忽略重复按键。
- `merge`：在有意按第二次后执行分步合并。

## 选择题判分

```ts
import { gradeChoiceAnswer, parseChoiceAnswer } from '@equakit/core';

const expected = parseChoiceAnswer('正确答案：A、C');
if (expected) {
  const result = gradeChoiceAnswer([2, 0], expected);
  console.log(result.correct); // true
}
```

答案限制为 A-H。标点、空格、`选 D`、`$D$`、`答案：AC` 以及 `\mathrm{A C}` 这类显示答案都会被接受。像 `不是 A` 这样的否定语句不会被猜测。

## 异步过期保护

```ts
import { StaleResponseGuard } from '@equakit/core';

const guard = new StaleResponseGuard<string>();

guard.setScope('problem-1');
const snapshot = guard.begin('check-answer');
const response = await checkAnswer();

if (guard.isCurrent(snapshot)) {
  applyResult(response);
}
```

如果只用普通的 map 状态，也可以改用 `nextMutationVersion` 和 `isCurrentMutation`。

## 许可证

[MIT License](./LICENSE) © 2026 leci
