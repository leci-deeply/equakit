# @equakit/react-katex

`@equakit/react-katex` 提供单个 LaTeX 公式的 React 渲染组件，负责行内/块级展示、KaTeX HTML 输出、安全回退和复制源码标记。

## 安装

```sh
pnpm add @equakit/react-katex @equakit/math-text @equakit/katex-engine react react-dom
```

## 使用

```tsx
import { MathFormula } from '@equakit/react-katex';
import '@equakit/react-katex/styles.css';

export function Example() {
  return <MathFormula expression="\\frac{1}{2}" ariaLabel="二分之一" />;
}
```

## API

- `MathFormula`：渲染公式，KaTeX 解析失败时显示 `fallback` 或归一化后的源码文本。
- `MathFormulaProps`：组件属性类型。

组件保留 `role="math"`、`aria-label` 和 `data-math-source` 行为，便于无障碍访问和复制适配器恢复 LaTeX。
