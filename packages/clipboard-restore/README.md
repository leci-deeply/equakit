# @equakit/clipboard-restore

`@equakit/clipboard-restore` 用于从富数学复制内容中恢复可编辑的 Markdown / LaTeX 文本。

## 能力

- 归一化剪贴板纯文本空白。
- 将松散的单行 LaTeX 恢复为 `\\(...\\)`。
- 从 HTML、DOM 根节点或选区恢复 Markdown。
- 读取公式节点上的源 LaTeX 标记属性，默认 `data-math-source`。
- 在没有标记属性时回退读取 MathML 的 TeX annotation。
- 支持通过 `displayMathSelector` 输出块级 `\\[...\\]`。

## 安装

```sh
pnpm add @equakit/clipboard-restore @equakit/math-text
```

## 使用

```ts
import { richHtmlToMarkdown } from '@equakit/clipboard-restore';

const markdown = richHtmlToMarkdown(
  event.clipboardData.getData('text/html'),
  event.clipboardData.getData('text/plain'),
);
```

这个包依赖 `@equakit/math-text`，不导入 KaTeX、React 或具体转换器。
