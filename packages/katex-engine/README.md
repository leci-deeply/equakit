# @equakit/katex-engine

`@equakit/katex-engine` 提供 EquaKit 的 LaTeX 结构化校验层。它复用 `@equakit/math-text` 的归一化和 token 提取能力，并通过 KaTeX 默认渲染器检查表达式是否合法。

## 能力

- 校验单个 LaTeX 表达式。
- 校验 Markdown 中的行内和块级数学。
- 报告 LaTeX 解析错误和不成对分隔符。
- 暴露 `LatexRenderer` 契约，允许调用方注入其他兼容渲染器。
- 默认实现使用 `katex.renderToString`。

## 安装

```sh
pnpm add @equakit/katex-engine @equakit/math-text katex
```

## 使用

```ts
import { validateMarkdownMath } from '@equakit/katex-engine';

const result = validateMarkdownMath('面积为 \\(a^2\\)');
if (!result.ok) {
  console.log(result.issues);
}
```

这个包只负责校验和渲染器契约，不包含剪贴板恢复、React 组件或具体编辑器适配。
