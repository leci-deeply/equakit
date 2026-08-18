# @equakit/clipboard-formats

`@equakit/clipboard-formats` 创建多 MIME 数学剪贴板 payload。它只识别单个公式并注入可选格式转换器，不绑定具体 MathML、AsciiMath 或 MathJSON 引擎。

## 能力

- 始终输出 `text/plain`。
- 当文本是单个公式时输出 `application/x-latex`。
- 通过同步转换器可选输出 MathML、AsciiMath 和 MathJSON。
- 单个转换器失败不会阻断其他格式。

## 安装

```sh
pnpm add @equakit/clipboard-formats @equakit/math-text
```

## 使用

```ts
import { createMathClipboardPayload } from '@equakit/clipboard-formats';

const payload = createMathClipboardPayload('\\(x^2+1\\)', {
  toMathML: (latex) => convertToMathML(latex),
  toAsciiMath: (latex) => convertToAsciiMath(latex),
  toMathJSON: (latex) => convertToMathJSON(latex),
});
```

这个包依赖 `@equakit/math-text`，不导入 React、DOM、KaTeX 或具体转换器。
