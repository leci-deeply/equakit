# @equakit/async-guard

按 key 管理变更版本，并用可选作用域匹配保护异步响应。

这个包只包含异步过期保护领域的纯 TypeScript API，不绑定任何请求库、状态库或运行时依赖。

## 能力

- 为每个 key 递增和检查变更版本。
- 生成包含 key、version 和可选 scope 的快照。
- 清理单个 key 或使全部已知 key 的旧版本失效。
- 在异步响应返回时确认快照仍是当前版本。
- 使用默认 `Object.is` 或自定义比较器检查作用域是否一致。
- 在响应过期时返回 `undefined` 或显式 fallback。

## 安装

```sh
pnpm add @equakit/async-guard
```

## 使用

```ts
import { StaleResponseGuard } from '@equakit/async-guard';

const guard = new StaleResponseGuard<string>();

guard.setScope('problem-1');
const snapshot = guard.begin('check-answer');
const response = await checkAnswer();

if (guard.isCurrent(snapshot)) {
  applyResult(response);
}
```

如果只用普通的 map 状态，也可以改用 `nextMutationVersion` 和 `isCurrentMutation`。

## 许可证

[MIT License](./LICENSE) © 2026 leci
