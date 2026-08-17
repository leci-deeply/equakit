# 发布清单

## 法律与所有权

- [x] 项目维护者已选择以 MIT License 对外授权。
- [ ] 确认贡献者署名要求。
- [x] 已加入 `Copyright (c) 2026 leci` 的 MIT License。
- [ ] 检查名称和包 scope 是否存在商标冲突。
- [ ] 确认没有复制第三方内容或私有 fixtures。

## 脱敏 - 阻断项

- [x] 搜索跟踪文件中的内部组织名和产品名。
- [x] 搜索域名、IP 地址、邮箱、token、凭据、bucket 名和服务 ID。
- [x] 检查生成产物、source map、lockfile、示例、快照和测试输出。
- [x] 确认 Git 历史从本仓库开始，且没有私有父提交。
- [x] 确认示例使用的是无业务归属的合成数据。

## 工程质量

- [x] `pnpm check` 在干净检出上通过。
- [x] 包 tarball 只包含预期文件（`npm pack --dry-run --json`）。
- [x] 公共 API 具备 README 示例和声明文件。
- [x] 已记录浏览器支持和 Node.js 支持。
- [x] 已为 Markdown、URL、HTML 和剪贴板这些敏感路径准备测试。
- [x] 已审查生产依赖许可证报告。

## 发布

- [ ] 准备发布 npm 时移除 package 的 `private: true`。
- [ ] 补齐 repository、bugs、homepage、author/maintainer 和 funding 元数据。
- [ ] 选定最终 package scope，并验证 registry 所有权。
- [ ] 启用分支保护、必需 CI、Dependabot/Renovate 和密钥扫描。
- [ ] 创建签名的 `v0.1.0` tag，并在需要时附带生成的 provenance。
