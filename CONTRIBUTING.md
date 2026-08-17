# 贡献指南

本项目当前仍是私有发布草稿。提交修改时，请继续保持 `docs/DESIGN.md` 里定义的包边界和安全默认值。

提交变更前：

```bash
pnpm exec playwright install chromium
pnpm check
```

检查 API 文档或构建完整在线站点：

```bash
pnpm docs:check
pnpm build:site
```

要求：

- 行为变更必须补充聚焦的测试。
- 示例数据必须是合成数据，不能带组织名或产品名。
- 不要启用原始 HTML，也不要放宽 KaTeX 的广泛信任回调。
- 不要引入应用层 DTO、API 客户端、埋点、账号状态。
- 对外 API 的变更要同步更新包级 README。
