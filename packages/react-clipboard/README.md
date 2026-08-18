# @equakit/react-clipboard

`@equakit/react-clipboard` 提供 React copy 事件处理、数学内容选区序列化、多 MIME 剪贴板写入和降级逻辑。

## 安装

```sh
pnpm add @equakit/react-clipboard @equakit/clipboard-restore @equakit/clipboard-formats react react-dom
```

## 使用

```tsx
import { MathCopyBoundary } from '@equakit/react-clipboard';
import '@equakit/react-clipboard/styles.css';

export function Example() {
  return <MathCopyBoundary>可复制的数学内容</MathCopyBoundary>;
}
```

## API

- `MathCopyBoundary`：为子内容添加数学复制边界。
- `useMathClipboard`：返回 `handleCopy` 与 `serializeSelection`。
- `serializeRenderedMath`：将 DOM 或 Range 序列化为 Markdown 数学文本。
- `normalizeClipboardText`：复用基础恢复包的剪贴板文本归一化。
- `createCoreMathClipboardSerializer`：兼容旧 core serializer 契约。
