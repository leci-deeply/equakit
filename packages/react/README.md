# @equakit/react

用于渲染、编辑、选择和复制数学富文本答案内容的无品牌 React 组件。

## 安装

```sh
pnpm add @equakit/react katex
```

请在应用入口同时引入包样式和 KaTeX CSS：

```ts
import 'katex/dist/katex.min.css';
import '@equakit/react/styles.css';
```

## 组件

- `MathFormula` 用 KaTeX 渲染单个 LaTeX 表达式，渲染失败时回退到源文本。
- `MarkdownMath` 渲染带 GFM 表格和 `$...$` / `$$...$$` 数学语法的 Markdown，刻意不启用原始 HTML。
- `FormulaInput` 提供受控的 LaTeX 文本框、可配置调色板、校验、光标插入和预览。
- `InteractiveChoices` 提供受控的单选 / 多选项，并可选地显示对错样式。
- `AnswerStepsEditor` 通过新增 / 删除控件编辑分步答案，并在 Backspace/Delete 边界合并时加保护。
- `useMathClipboard` 和 `MathCopyBoundary` 会在复制时把渲染后的数学内容序列化回更适合 Markdown 的 LaTeX。

## 示例

```tsx
import { AnswerStepsEditor, MarkdownMath, MathCopyBoundary } from '@equakit/react';
import { useState } from 'react';

export function SolutionEditor() {
  const [steps, setSteps] = useState(['使用 $a^2+b^2=c^2$。']);

  return (
    <MathCopyBoundary>
      <MarkdownMath>{'这个恒等式是 $a^2+b^2=c^2$。'}</MarkdownMath>
      <AnswerStepsEditor steps={steps} onChange={setSteps} />
    </MathCopyBoundary>
  );
}
```

## 核心剪贴板适配

如果 `@equakit/core` 提供了 DOM 序列化器，就可以通过结构化适配器直接传进去：

```tsx
import * as core from '@equakit/core';
import { MathCopyBoundary } from '@equakit/react';

<MathCopyBoundary core={core}>...</MathCopyBoundary>;
```

这个 React 包还包含一个 DOM 回退方案，会读取中性的 `data-math-source` 标记和 KaTeX 注释。

`MathCopyBoundary` 的 `converter` 属性可以为单公式选区增加 MathML、AsciiMath 和 MathJSON。
官方可选实现位于 `@equakit/adapter-mathlive/clipboard`：

```tsx
import { mathLiveClipboardConverter } from '@equakit/adapter-mathlive/clipboard';

<MathCopyBoundary converter={mathLiveClipboardConverter}>...</MathCopyBoundary>;
```

转换器必须同步执行，因为浏览器只允许在原生 copy 事件处理期间写入 `clipboardData`。

`FormulaInput` 的 `editor` 属性接受实现 `FormulaInputEditorComponent` 契约的可选输入器。
默认实现仍是轻量 textarea；结构化输入可以安装独立的
[`@equakit/adapter-mathlive`](../adapter-mathlive/README.md)，不会增加本包的默认体积。

`InteractiveChoices` 默认使用“选择答案”作为无障碍分组名称，可以通过 `legend`
属性传入更具体的题目上下文；文字在视觉上隐藏，但会被辅助技术读取。

## 许可证

[MIT License](./LICENSE) © 2026 leci
