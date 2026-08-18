# @equakit/answer-steps

分步答案文本解析、格式化与编辑边界状态机工具。

这个包只包含分步答案领域的纯 TypeScript API，不绑定任何框架、编辑器或运行时依赖。

## 能力

- 将自由文本、OCR 文本或上传内容转换为稳定的步骤行。
- 格式化带编号或不带编号的分步答案。
- 保留编辑器原始行，并在提交时合并为纯文本。
- 按光标位置拆分步骤，或合并相邻步骤。
- 使用“按两次 Backspace/Delete”状态机处理步骤边界删除。
- 判断当前浏览器选区是否仍匹配已记录的边界范围。

## 安装

```sh
pnpm add @equakit/answer-steps
```

## 使用

```ts
import {
  formatStepAnswer,
  stepBoundaryDeletionAction,
  stepTextToLines,
} from '@equakit/answer-steps';

const lines = stepTextToLines('1. 令 x = 1\n2. 因此 x^2 = 1');
const text = formatStepAnswer({ steps: lines });

const action = stepBoundaryDeletionAction({
  key: 'Backspace',
  selectionCollapsed: true,
  atStepBoundary: true,
  targetAlreadyArmed: false,
});
```

`stepBoundaryDeletionAction` 的返回值含义如下：

- `none`：让编辑器正常处理事件。
- `arm`：阻止默认删除，并记住边界范围。
- `hold`：在同一个边界已被武装时忽略重复按键。
- `merge`：在有意按第二次后执行分步合并。

## 许可证

[MIT License](./LICENSE) © 2026 leci
