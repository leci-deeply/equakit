# @equakit/tiptap-math

为 TipTap 3 提供 EquaKit 风格的 inline/block 数学节点配置、剪贴板集成和旧内容迁移。

本包复用官方 `@tiptap/extension-mathematics`，不会复制另一套 ProseMirror schema 或
NodeView。官方扩展负责节点、命令和 KaTeX 渲染；EquaKit adapter 负责稳定配置、安全默认值
以及迁移正则。

## 安装

```sh
pnpm add @equakit/tiptap-math \
  @tiptap/core @tiptap/pm @tiptap/extension-mathematics @tiptap/starter-kit katex
```

示例使用 StarterKit；已有 Document/Paragraph/Text 等基础 schema 时可以不安装它。React 项目
还需要 `@tiptap/react`。所有 TipTap 包应保持相同版本，当前 adapter 基于 TipTap `3.30.1`。

## 基础用法

```ts
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { createTipTapMathExtensions } from '@equakit/tiptap-math';

const editor = new Editor({
  extensions: [StarterKit, ...createTipTapMathExtensions()],
  content: `
    <p>行内公式：<span data-type="inline-math" data-latex="x^2+1"></span></p>
    <div data-type="block-math" data-latex="\\int_0^1 x\\,dx"></div>
  `,
});
```

不要同时注册官方 `Mathematics` 和 `createTipTapMathExtensions()` 的返回值，否则会产生重复的
`inlineMath` / `blockMath` 扩展名称。

## 安全 KaTeX 默认值

```ts
const extensions = createTipTapMathExtensions({
  katexOptions: {
    macros: { '\\R': '\\mathbb{R}' },
  },
});
```

Adapter 固定以下边界，调用方不能覆盖：

- inline `displayMode: false`；
- block `displayMode: true`；
- `trust: false`；
- `throwOnError: false`；
- `strict: 'ignore'`。

其他 KaTeX 选项和宏仍可配置。需要完全控制 KaTeX 时，可以直接使用本包重新导出的
`InlineMath` 和 `BlockMath`，但宿主应用需要自行承担安全审查。

## EquaKit 剪贴板

TipTap 数学 NodeView 使用 `data-latex` 保存源码。宿主复制组件可以直接传入 adapter 提供的
选项：

```ts
import { TIPTAP_MATH_CLIPBOARD_OPTIONS } from '@equakit/tiptap-math';

copyBoundaryOptions.options = TIPTAP_MATH_CLIPBOARD_OPTIONS;
```

这样复制渲染后的 KaTeX DOM 时会恢复 `data-latex`，而不是复制视觉字符；inline 节点输出
`\\(...\\)`，block 节点输出 `\\[...\\]`。

## 迁移旧 `$...$` 文本

```ts
import { migrateEquaKitMathStrings } from '@equakit/tiptap-math';

migrateEquaKitMathStrings(editor);
```

EquaKit 的默认迁移正则会避开 `$100$` 这类价格，并防止从价格的闭合 `$` 跨到后续公式。
本包仍重新导出 TipTap 官方的 `migrateMathStrings`、`createMathMigrateTransaction` 和
`mathMigrationRegex`，用于需要完全兼容官方行为的场景。

## SSR 与 NodeView 边界

官方 Mathematics NodeView 在浏览器中通过 KaTeX 渲染。持久化 HTML/JSON 会保存 LaTeX
属性，但不会变成可直接展示的完整公式 HTML。服务端展示建议读取 `latex`，再使用 KaTeX
`renderToString()` 或宿主应用自己的展示组件。

本包不依赖 `@tiptap/react`，也没有自定义 React NodeView。需要在节点内部嵌入完整编辑 UI
时，应在宿主应用中基于官方 `ReactNodeViewRenderer` 扩展，而不是改变持久化 schema。

## 许可证

[MIT License](./LICENSE) © 2026 leci
