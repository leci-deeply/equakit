# @equakit/mathlive-editor

为 `@equakit/react-formula-input` 的编辑器契约提供可选 MathLive 数学输入器。

这个包只负责把 MathLive 挂载为受控公式编辑器，不包含剪贴板格式转换，也不依赖
Compute Engine。MathLive 会在浏览器挂载后动态加载，因此服务端渲染不会访问 `window`、
`document` 或 Custom Elements API。

## 安装

```sh
pnpm add @equakit/react-formula-input @equakit/mathlive-editor mathlive react
```

MathLive 是 peer dependency。必须使用 `0.110.0` 或更高版本；`0.110.0` 修复了
`GHSA-fm7p-gw32-828p` 中记录的 HTML 转义问题。

## 基础用法

使用 Vite、Webpack 或其他资产管线时，建议显式引入 MathLive 字体样式：

```tsx
import 'mathlive/fonts.css';

import { FormulaInput } from '@equakit/react-formula-input';
import { MathLiveFormulaEditor } from '@equakit/mathlive-editor';
import { useState } from 'react';

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

`FormulaInput` 继续负责调色板、校验、错误状态和预览；本包负责 MathLive 的结构化选区、
公式插入和虚拟键盘。

## 配置

```tsx
import { createMathLiveFormulaEditor } from '@equakit/mathlive-editor';

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
editor，应统一这两个路径，不要为不同实例配置相互冲突的值。默认导出的
`MathLiveFormulaEditor` 会关闭可选按键音，避免产生额外声音资源请求。

## 行为与边界

- 调色板调用 MathLive `insert()`，使用 `replaceSelection` 和结构化 placeholder；
- 外部 `value` 变化只在内容不一致时回写，避免每次输入重置 MathLive 选区；
- `input` 事件负责同步受控值；
- MathLive Shadow DOM 的 keyboard sink 会继承输入器的无障碍名称；
- 加载失败时显示中文 `role="alert"`，不会静默吞掉错误；
- 本包不提供 MathLive SSR 静态渲染，也不提供 MathML、AsciiMath 或 MathJSON 转换。

多格式剪贴板转换请使用独立的 `@equakit/mathlive-formats`。

## 许可证

[MIT License](./LICENSE) © 2026 leci
