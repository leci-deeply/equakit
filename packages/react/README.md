# @math-rich-editor/react

用于渲染、编辑、选择和复制数学富文本答案内容的无品牌 React 组件。

## 安装

```sh
pnpm add @math-rich-editor/react katex
```

请在应用入口同时引入包样式和 KaTeX CSS：

```ts
import 'katex/dist/katex.min.css';
import '@math-rich-editor/react/styles.css';
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
import { AnswerStepsEditor, MarkdownMath, MathCopyBoundary } from '@math-rich-editor/react';
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

如果 `@math-rich-editor/core` 提供了 DOM 序列化器，就可以通过结构化适配器直接传进去：

```tsx
import * as core from '@math-rich-editor/core';
import { MathCopyBoundary } from '@math-rich-editor/react';

<MathCopyBoundary core={core}>...</MathCopyBoundary>;
```

这个 React 包还包含一个 DOM 回退方案，会读取中性的 `data-math-source` 标记和 KaTeX 注释。
