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

在 AI 对话等窄容器中，可以只为真正超宽的公式显示滚动提示：

```tsx
export function AiAnswer({ answer }: { answer: string }) {
  return <MarkdownMath overflowIndicator="hover-scrollbar">{answer}</MarkdownMath>;
}
```

`hover-scrollbar` 只控制桌面端 hover/focus 时的横向滚动条提示；触屏端可以直接左右滑动。无论是否启用提示，实际溢出的公式都会进入键盘 Tab 顺序，并支持方向键、Home 和 End，短公式不受影响。

## API

- `MarkdownMath`：渲染 Markdown、GFM 与数学内容。
- `safeUrlTransform`：保留 `http:`、`https:`、`mailto:`、`tel:`、锚点和相对路径，拒绝不安全 URL。
- `FormulaOverflowIndicator`：`none | hover-scrollbar`，控制公式溢出提示，默认 `none`。
- `MarkdownMathProps`：组件属性类型。
