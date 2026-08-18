# 更新日志

本项目遵循面向公开仓库的中文变更记录。0.x 阶段的 API 仍可能调整，发布前请以 README、
包级 README 和发布清单为准。

## [0.1.0] - 未发布

### 状态

- `0.1.0` 尚未发布到 npm。
- 仓库内所有 workspace package 仍保持 `private: true`，npm 发布流程继续暂缓。

### 已完成

- 拆分 16 个原子包和 4 个兼容重导出包。
- 补齐数学文本、KaTeX、剪贴板、答案步骤、选择题、React 组件、MathLive 和 TipTap 能力。
- 建立 Node.js 22 完整 CI，以及 Node.js 22 / 24 和 React 18.3.1 / 19.2.x 的兼容性验证目标。
- 增加 Chromium、Firefox、WebKit 浏览器矩阵，并修复 WebKit 下 TipTap 插入命令的 selection 时序问题。
- 所有包在构建前安全清理 `dist`，包验证从 manifest 动态读取版本，不再绑定 `0.1.0` 文件名。
- 补充公开仓库治理文件、贡献说明、安全报告入口和发布检查清单。
- 启用 Dependabot、分支保护、私密漏洞报告和 CodeQL 安全扫描。
- 增加 Demo JavaScript/CSS 体积预算和 MathLive 独立分块门禁。
