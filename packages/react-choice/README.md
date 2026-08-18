# @equakit/react-choice

`@equakit/react-choice` 提供可访问的单选/多选交互，并通过 `@equakit/react-markdown-math` 渲染数学选项内容。

## 安装

```sh
pnpm add @equakit/react-choice @equakit/react-markdown-math react react-dom
```

## 使用

```tsx
import { useState } from 'react';
import { InteractiveChoices } from '@equakit/react-choice';
import '@equakit/react-choice/styles.css';
import '@equakit/react-markdown-math/styles.css';

export function Example() {
  const [selected, setSelected] = useState<string[]>([]);
  return <InteractiveChoices choices={['$1$', '$2$']} selected={selected} onChange={setSelected} />;
}
```

## API

- `InteractiveChoices`：受控单选/多选组件。
- `InteractiveChoice`：结构化选项类型。
- `InteractiveChoicesProps`：组件属性类型。

组件保留隐藏 legend、radio/checkbox 语义、结果状态类名和错误选择的 `aria-invalid`。
