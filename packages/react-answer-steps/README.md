# @equakit/react-answer-steps

`@equakit/react-answer-steps` 提供分步答案编辑器与键盘边界删除保护。

## 安装

```sh
pnpm add @equakit/react-answer-steps @equakit/answer-steps react react-dom
```

## 使用

```tsx
import { useState } from 'react';
import { AnswerStepsEditor } from '@equakit/react-answer-steps';
import '@equakit/react-answer-steps/styles.css';

export function Example() {
  const [steps, setSteps] = useState(['']);
  return <AnswerStepsEditor steps={steps} onChange={setSteps} />;
}
```

## API

- `AnswerStepsEditor`：受控步骤编辑器，保留中文默认文案与删除边界交互。
- `getStepBoundaryAction`：根据按键、选区和边界状态返回动作。
- `mergeStepAtBoundary`：按 Backspace/Delete 合并相邻步骤。
