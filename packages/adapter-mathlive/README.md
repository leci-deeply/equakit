# @equakit/adapter-mathlive

> 兼容聚合包：编辑器实现已经迁移到 `@equakit/mathlive-editor`，多格式转换已经迁移到
> `@equakit/mathlive-formats`。本包仅保留旧入口和 `./clipboard` 子路径的重导出。

为 `@equakit/react` 的 `FormulaInput` 提供可选 MathLive 数学输入器。

这个包不会改变 `FormulaInput` 的受控 `value/onChange` 模型，也不会让 MathLive 进入
`@equakit/react` 的默认依赖。MathLive 只会在浏览器挂载后动态加载，因此服务端渲染不会访问
`window`、`document` 或 Custom Elements API。

## 安装

```sh
pnpm add @equakit/react @equakit/adapter-mathlive mathlive katex
```

MathLive 是 peer dependency。必须使用 `0.110.0` 或更高版本；`0.110.0` 修复了
[`GHSA-fm7p-gw32-828p`](https://github.com/advisories/GHSA-fm7p-gw32-828p)
中记录的 HTML 转义问题。

## 基础用法

使用 Vite、Webpack 或其他资产管线时，建议显式引入 MathLive 字体样式：

```tsx
import 'mathlive/fonts.css';

import { useState } from 'react';
import { MathLiveFormulaEditor } from '@equakit/adapter-mathlive';
import { FormulaInput } from '@equakit/react';

export function RichFormulaEditor() {
  const [value, setValue] = useState(String.raw`\frac{1}{2}`);

  return (
    <FormulaInput
      editor={MathLiveFormulaEditor}
      onChange={setValue}
      textareaLabel="数学公式"
      value={value}
    />
  );
}
```

`FormulaInput` 继续负责调色板、校验、错误状态和 KaTeX 预览；adapter 负责 MathLive
的结构化选区、公式插入和虚拟键盘。

## 配置

```tsx
import { createMathLiveFormulaEditor } from '@equakit/adapter-mathlive';

const ManualMathLiveEditor = createMathLiveFormulaEditor({
  virtualKeyboardPolicy: 'manual',
  smartFence: true,
  popoverPolicy: 'off',
  soundsDirectory: null,
});
```

可配置项包括：

- `virtualKeyboardPolicy`：`auto`、`manual` 或 `sandboxed`；
- `smartFence`：是否自动生成匹配的结构化括号；
- `popoverPolicy`：是否显示命令建议；
- `fontsDirectory`、`soundsDirectory`：静态资源路径，`null` 表示禁止动态加载；
- `onReady`：获得已挂载的 `MathfieldElement`；
- `onLoadError`：处理动态模块加载失败。

`fontsDirectory` 和 `soundsDirectory` 是 MathLive 的进程级静态配置。一个页面如果创建多套
adapter，应统一这两个路径，不要为不同实例配置相互冲突的值。

如果没有引入 `mathlive/fonts.css`，宿主应用需要按 MathLive 文档把 `fonts/` 复制到
构建输出，并通过 `fontsDirectory` 指向该目录。默认 adapter 关闭可选按键音，避免产生额外
声音资源请求。

## 行为与边界

- 调色板调用 MathLive `insert()`，使用 `replaceSelection` 和结构化 placeholder；
- 外部 `value` 变化只在内容不一致时回写，避免每次输入重置 MathLive 选区；
- `input` 事件负责同步受控值，`FormulaInput` 的验证和预览保持不变；
- MathLive Shadow DOM 的 keyboard sink 会继承输入器的无障碍名称；
- 加载失败时显示中文 `role="alert"`，不会静默吞掉错误；
- adapter 不提供 MathLive SSR 静态渲染，静态展示仍使用 EquaKit 的 KaTeX 组件。

## 多格式剪贴板转换器

`./clipboard` 子入口是独立 opt-in，不会进入默认 MathLive 编辑器入口：

```sh
pnpm add @cortex-js/compute-engine
```

```tsx
import { mathLiveClipboardConverter } from '@equakit/adapter-mathlive/clipboard';
import { MathCopyBoundary } from '@equakit/react';

<MathCopyBoundary converter={mathLiveClipboardConverter}>...</MathCopyBoundary>;
```

它使用 `mathlive/ssr` 同步生成 MathML 和 AsciiMath，使用 Cortex Compute Engine 生成
MathJSON。默认 MathJSON 使用接近原始 LaTeX 的 raw form；需要规范化表达式时可以使用：

```ts
import { createMathLiveClipboardConverter } from '@equakit/adapter-mathlive/clipboard';

const converter = createMathLiveClipboardConverter({ canonicalMathJSON: true });
```

MathML 会补充 `<math xmlns="http://www.w3.org/1998/Math/MathML">` 根节点，可以直接作为
`application/mathml+xml` 使用。

Compute Engine 体积较大。浏览器应用建议动态导入 `@equakit/adapter-mathlive/clipboard`，
加载完成后再把 converter 传给 `MathCopyBoundary`；默认编辑器入口不会加载这个子模块。

## 许可证

[MIT License](./LICENSE) © 2026 leci
