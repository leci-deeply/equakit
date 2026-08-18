# @equakit/math-text

`@equakit/math-text` 提供无生产依赖的数学文本工具，用于在进入渲染器或编辑器前处理 LaTeX / Markdown 数学内容。

## 能力

- 判断一行文本是否像独立 LaTeX 公式。
- 移除嵌套的 `$...$`、`$$...$$`、`\\(...\\)`、`\\[...\\]` 数学分隔符。
- 归一化单个 LaTeX 表达式和 Markdown 数学分隔符。
- 将裸 LaTeX 行包裹为展示公式。
- 从 Markdown 数学文本中提取行内和块级公式 token。

## 安装

```sh
pnpm add @equakit/math-text
```

## 使用

```ts
import { extractMathTokens, normalizeMarkdownMath } from '@equakit/math-text';

const markdown = normalizeMarkdownMath(String.raw`
面积为 \(a^2\)
\frac{1}{2} + \sqrt{x}
`);

const tokens = extractMathTokens(markdown);
```

这个包不导入 KaTeX、React、DOM 或具体编辑器适配器。
