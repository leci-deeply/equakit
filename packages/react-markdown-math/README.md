# @equakit/react-markdown-math

`@equakit/react-markdown-math` 渲染包含 GFM 与数学表达式的 Markdown，并过滤不安全 URL。

## 安装

```sh
pnpm add @equakit/react-markdown-math @equakit/math-text react react-dom
```

## 使用

```tsx
import { MarkdownMath } from '@equakit/react-markdown-math';
import '@equakit/react-markdown-math/styles.css';

export function Example() {
  return <MarkdownMath>{'面积公式 $S=\\pi r^2$'}</MarkdownMath>;
}
```

## API

- `MarkdownMath`：渲染 Markdown、GFM 与数学内容。
- `safeUrlTransform`：保留 `http:`、`https:`、`mailto:`、`tel:`、锚点和相对路径，拒绝不安全 URL。
- `MarkdownMathProps`：组件属性类型。
