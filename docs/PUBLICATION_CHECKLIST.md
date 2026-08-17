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
- [x] core、React、MathLive adapter 和 TipTap adapter 都具备独立 LICENSE 与发布元数据。
- [x] 公共 API 具备 README 示例和声明文件。
- [x] 已记录浏览器支持和 Node.js 支持。
- [x] 已为 Markdown、URL、HTML 和剪贴板这些敏感路径准备测试。
- [x] 已加入 Chromium 复制、光标、IME、MathLive、TipTap、键盘语义和 axe 无障碍测试。
- [x] 已验证单公式五种 MIME 输出和混合正文降级策略。
- [x] TypeDoc API 转换、Playground/API 站点组合与静态脱敏检查通过。
- [x] 已审查生产依赖许可证报告。

## 发布

- [ ] 准备发布 npm 时移除 package 的 `private: true`。
- [x] 补齐 repository、bugs、homepage、author 和公开发布策略元数据。
- [ ] npm 身份确定后补充 maintainer；存在真实赞助入口时再补 funding。
- [x] 已创建 npm `equakit` 组织并取得 `@equakit` package scope。
- [ ] 首次发布前通过 npm CLI 或可信发布再次验证写权限。
- [ ] 启用分支保护、必需 CI、Dependabot/Renovate 和密钥扫描。
- [ ] 创建签名的 `v0.1.0` tag，并在需要时附带生成的 provenance。
- [ ] 确认 GitHub Pages 公开地址部署成功。
