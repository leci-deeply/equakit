# @equakit/mathlive-formats

基于 MathLive SSR 和 Cortex Compute Engine 的多格式数学剪贴板转换器。

这个包提供与 EquaKit `MathClipboardFormatConverter` 兼容的对象，可把单个 LaTeX 公式同步
转换为 MathML、AsciiMath 和 MathJSON。它不依赖 React，也不包含 MathLive 编辑器。

## 安装

```sh
pnpm add @equakit/mathlive-formats mathlive @cortex-js/compute-engine
```

MathLive 和 Compute Engine 都是 peer dependency。浏览器应用如果只在复制单公式时需要额外
MIME 格式，建议动态导入本包，避免把转换引擎放入首屏编辑器入口。

## 基础用法

```ts
import { mathLiveClipboardConverter } from '@equakit/mathlive-formats';

copyBoundaryOptions.converter = mathLiveClipboardConverter;
```

默认 MathJSON 使用接近原始 LaTeX 的 raw form：

```ts
mathLiveClipboardConverter.toMathJSON(String.raw`\frac{1}{2}`);
// ['Divide', 1, 2]
```

需要规范化表达式时可以启用 canonical MathJSON：

```ts
import { createMathLiveClipboardConverter } from '@equakit/mathlive-formats';

const converter = createMathLiveClipboardConverter({ canonicalMathJSON: true });
```

## API

```ts
interface MathClipboardFormatConverter {
  toMathML?: (latex: string) => string | null | undefined;
  toAsciiMath?: (latex: string) => string | null | undefined;
  toMathJSON?: (latex: string) => unknown;
}
```

`createMathLiveClipboardConverter()` 返回的对象实现该契约：

- `toMathML()` 使用 `mathlive/ssr` 生成 MathML，并补齐可直接作为
  `application/mathml+xml` 使用的 `<math xmlns="http://www.w3.org/1998/Math/MathML">`
  根节点；
- `toAsciiMath()` 使用 `mathlive/ssr` 生成 AsciiMath；
- `toMathJSON()` 使用 Cortex Compute Engine 生成 MathJSON。

## 许可证

[MIT License](./LICENSE) © 2026 leci
