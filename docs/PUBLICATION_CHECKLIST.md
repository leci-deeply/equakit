# 发布清单

当前状态：首批 npm `0.1.0` 已公开发布公式链路的 4 个原子包：`math-text`、`katex-engine`、
`react-katex` 和 `react-markdown-math`。其余 16 个 package 保留 `private: true`；`core`、`react`、
`adapter-mathlive` 和 `adapter-tiptap` 只保留仓库内兼容重导出。

## 法律与所有权

- [x] 项目维护者已选择以 MIT License 对外授权。
- [x] 已确认当前版本没有需要补充署名的其他贡献者。
- [x] 已加入 `Copyright (c) 2026 leci` 的 MIT License。
- [x] 已完成有限名称初筛，未发现 `EquaKit` 精确同名公开结果；该结论不等同于完整商标清查。
- [x] 仓库、完整 Git 历史和发布 tarball 的技术扫描未发现复制的第三方源码、素材或私有 fixtures；生产依赖均通过包管理器引用并已记录许可证。

## 脱敏 - 阻断项

- [x] 搜索跟踪文件中的内部组织名和产品名。
- [x] 搜索域名、IP 地址、邮箱、token、凭据、bucket 名和服务 ID。
- [x] 检查生成产物、source map、lockfile、示例、快照和测试输出。
- [x] 确认 Git 历史从本仓库开始，且没有私有父提交。
- [x] 确认示例使用的是无业务归属的合成数据。

## 工程质量

- [x] `pnpm check` 在干净检出上通过。
- [x] CI 保留 Node.js 22 完整 `check` 状态上下文，并增加 Node.js 22 / 24 轻量矩阵。
- [x] CI 在临时工作区验证 React 18.3.1 / 19.2.x 兼容性，不持久修改 lockfile。
- [x] 使用 `pnpm pack` 生成真实 tarball，并确认只包含预期文件。
- [x] 16 个原子包和 4 个兼容重导出包都具备独立 LICENSE 与发布元数据。
- [x] 公共 API 具备 README 示例和声明文件。
- [x] 已记录浏览器支持和 Node.js 支持。
- [x] 已为 Markdown、URL、HTML 和剪贴板这些敏感路径准备测试。
- [x] 已加入 Chromium、Firefox、WebKit 矩阵；单测 67 个，Chromium 15 项，全浏览器 22 项通过、8 项按能力边界跳过，视觉截图回归完全一致。
- [x] 已验证单公式五种 MIME 输出和混合正文降级策略。
- [x] TypeDoc API 转换、Playground/API 站点组合与静态脱敏检查通过。
- [x] KaTeX 0.18.4 单版本解析、0.17/0.18 像素一致性和持续截图回归通过。
- [x] 已审查生产依赖许可证报告。

## 发布

- [x] 首批 4 个公式包设置为 `private: false`，其余 package 继续保留发布保护。
- [x] 补齐 repository、bugs、homepage、author 和公开发布策略元数据。
- [x] npm maintainer 已确认为 `leci0099`；存在真实赞助入口时再补 funding。
- [x] 已创建 npm `equakit` 组织并取得 `@equakit` package scope。
- [x] 已通过 npm CLI 验证 `leci0099` 是 `equakit` organization owner。
- [x] npm maintainer 账号已启用 `auth-and-writes` 2FA。
- [x] `pnpm release:formula:dry-run` 已验证 4 个公开包的最终 tarball 和 public access。
- [x] 4 个公式包的 `0.1.0` 已发布，npm access 状态均为 public。
- [x] 已启用 `main` 分支保护、必需 `check`、管理员约束、密钥扫描和 push protection。
- [x] 已加入 Dependabot npm 和 GitHub Actions 更新配置。
- [x] 已启用 Dependabot security updates 和 GitHub Private Vulnerability Reporting。
- [x] 已加入 CodeQL JavaScript/TypeScript 安全扫描工作流。
- [x] 已加入 Demo JavaScript/CSS 体积预算和 MathLive 独立分块检查。
- [x] 已创建并推送 `v0.1.0` tag 和 GitHub Release；首版 tag 具备本地 SSH 签名，但旧密钥未被
      GitHub 账号验证，且首版未启用 npm provenance。为保持公开 tag 不变，不回写首版发布。
- [x] 已登记 EquaKit 专用 GitHub Signing Key；后续提交与 tag 使用 GitHub 可验证签名。
- [x] 已加入校验 main、tag、版本和 tarball 的 npm OIDC 发布工作流。
- [x] 已为 4 个公开包绑定 `publish.yml` npm Trusted Publisher；后续版本自动生成 provenance。
- [x] GitHub Pages Playground 与 API 文档公开地址部署成功。
