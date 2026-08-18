# 贡献指南

本项目当前仍是私有发布草稿，`0.1.0` 尚未发布到 npm，workspace package 仍保持
`private: true`。提交修改时，请继续保持 `docs/DESIGN.md` 里定义的包边界和安全默认值。

提交变更前：

```bash
pnpm exec playwright install chromium
pnpm check
```

验证 Firefox / WebKit 兼容性：

```bash
pnpm exec playwright install firefox webkit
pnpm test:browser:compat
```

CI 会保留 `check` 状态上下文作为 Node.js 22 完整检查，并额外运行 Node.js 22 / 24 的轻量
`install`、`typecheck`、`test`、`build` 矩阵。React 兼容作业会在 CI 临时工作区切换
React 18.3.1 和 19.2.x，并对 React 相关包运行类型检查和测试；不要把这类临时版本切换提交到
package manifest 或 lockfile。Firefox / WebKit 作业会运行不依赖 Chromium 专属权限的浏览器测试。

检查 API 文档或构建完整在线站点：

```bash
pnpm docs:check
pnpm verify:boundaries
pnpm build:site
```

KaTeX、公式 CSS 或字体发生变化时必须运行视觉测试：

```bash
pnpm test:visual
```

只有人工审查差异通过后，才能使用 `--update-snapshots` 更新截图基线。

要求：

- 行为变更必须补充聚焦的测试。
- 示例数据必须是合成数据，不能带组织名或产品名。
- 不要启用原始 HTML，也不要放宽 KaTeX 的广泛信任回调。
- 不要引入应用层 DTO、API 客户端、埋点、账号状态。
- 对外 API 的变更要同步更新包级 README。
- 原子技能只能依赖更底层的窄能力，禁止依赖 `@equakit/core`、`@equakit/react` 或旧 adapter 聚合包。
- 新增原子技能时必须同步更新 `scripts/package-catalog.mjs`、TypeDoc 入口、依赖边界校验和真实 tarball 消费验证。
- 兼容聚合包只允许显式重导出，不得重新加入业务实现。
- 不要添加 npm publish workflow；发布前必须先完成发布清单并移除 package 的 `private: true`。
