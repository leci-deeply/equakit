# @equakit/choice

A-H 选择题答案解析、转换与判分工具。

这个包只包含选择题领域的纯 TypeScript API，不绑定任何框架、题库格式或运行时依赖。

## 能力

- 归一化 `A-H` 范围内的单选或多选答案。
- 解析常见中文、英文、LaTeX 展示答案。
- 在选项索引和选项字母之间转换。
- 推断答案是否为多选。
- 判定已选选项是否正确，并返回缺选与多选明细。

## 安装

```sh
pnpm add @equakit/choice
```

## 使用

```ts
import { gradeChoiceAnswer, parseChoiceAnswer } from '@equakit/choice';

const expected = parseChoiceAnswer('正确答案：A、C');
if (expected) {
  const result = gradeChoiceAnswer([2, 0], expected);
  console.log(result.correct); // true
}
```

答案限制为 A-H。标点、空格、`选 D`、`$D$`、`答案：AC` 以及
`\mathrm{A C}` 这类显示答案都会被接受。像 `不是 A` 这样的否定语句不会被猜测。

## 许可证

[MIT License](./LICENSE) © 2026 leci
