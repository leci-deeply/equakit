# @equakit/react-formula-input

`@equakit/react-formula-input` 提供受控公式输入、公式面板、预览、校验和可替换编辑器契约。

## 安装

```sh
pnpm add @equakit/react-formula-input @equakit/react-katex @equakit/katex-engine react react-dom
```

## 使用

```tsx
import { useState } from 'react';
import { FormulaInput } from '@equakit/react-formula-input';
import '@equakit/react-formula-input/styles.css';
import '@equakit/react-katex/styles.css';

export function Example() {
  const [value, setValue] = useState('');
  return <FormulaInput value={value} onChange={setValue} />;
}
```

## API

- `FormulaInput`：受控输入组件，保留中文默认文案、面板插入、预览和校验状态。
- `DEFAULT_FORMULA_PALETTE`：默认公式面板。
- `insertFormulaSnippet`：按选区插入片段并返回新光标位置。
- `FormulaInputEditorComponent` / `FormulaInputEditorHandle`：自定义编辑器适配契约。
