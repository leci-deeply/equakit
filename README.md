# Math Rich Editor Kit

一个与框架无关的 TypeScript 核心层，加上一个可选的 React 层，用于数学富文本的复制、粘贴、编辑、校验、渲染和答案交互。

> 发布状态：本地整理稿。当前尚未获得再发布许可，因此各包仍保持 `private: true`，直到权利人批准许可证并完成发布清单。

## 包结构

| 包名                      | 职责                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `@math-rich-editor/core`  | LaTeX 归一化与校验、渲染后数学内容的剪贴板恢复、分步答案编辑规则、选择题判分、异步过期响应保护。 |
| `@math-rich-editor/react` | 安全的 KaTeX 与 Markdown 渲染、公式输入、可访问的选择题、分步答案编辑、数学感知复制辅助。        |

核心包不包含产品、账号、课程、数据库或网络概念。React 包只依赖核心包和公开渲染库。

## 设计目标

- 用户复制渲染后的 KaTeX 或 MathML 时，保留规范化的 LaTeX。
- 在不改写普通文本的前提下，归一化常见的错误数学分隔符。
- 让不完整公式仍然可编辑，并提供可读的降级结果，而不是直接崩溃。
- 把过期的异步结果和乐观更新显式化，而不是依赖时序运气。
- 提供可控、可访问的 React 组件，不强迫宿主应用接管状态管理。
- Markdown 渲染默认关闭原始 HTML。

## 公开项目参考后的可优化点

以下方向来自对当前公开项目官方仓库和文档的对标：

1. 参考 [MathLive](https://github.com/arnog/mathlive)，为 `FormulaInput` 增加按需加载的高级输入适配器，支持虚拟键盘、MathML、AsciiMath 和 MathJSON；当前 textarea + palette 继续保留为轻量默认实现。
2. 参考 [TipTap Mathematics](https://tiptap.dev/docs/editor/extensions/nodes/mathematics)，增加可选的 inline/block math node 适配器和旧数学字符串迁移工具，而不是把完整富文本编辑器塞入核心包。
3. 参考 [unified-latex](https://github.com/siefkenj/unified-latex)，把 AST 解析与重写做成独立可选包，并补自动 API 文档、playground 和真实 tarball 安装测试。
4. 参考 [MathLive 的无障碍能力](https://github.com/arnog/mathlive)与 [KaTeX](https://github.com/KaTeX/KaTeX) 的 HTML + MathML 输出，补可朗读文本、屏幕阅读器策略和浏览器级无障碍测试。
5. 参考 [remark-math](https://github.com/remarkjs/remark-math) 的解析/渲染分层，把 `MarkdownMath` 的插件链开放为安全 preset；只有明确启用 HTML 扩展时才引入 `rehype-sanitize`。
6. 当前运行时仍使用 KaTeX `^0.17.0`；正式发布前应对照 [KaTeX 官方仓库](https://github.com/KaTeX/KaTeX)评估升级到 `0.18.x`，并执行视觉快照和兼容性回归。

## 开发

要求：Node.js 22+ 和 pnpm 10。

```bash
pnpm install
pnpm check
```

单独构建某个包：

```bash
pnpm --filter @math-rich-editor/core build
pnpm --filter @math-rich-editor/react build
```

`examples/basic` 下提供了一个交互式合成数据示例，并包含在工作区构建中。

## 兼容性

- 发布后的 JavaScript 目标是 ES2022 模块。
- 开发工具链要求 Node.js 22 或更高版本。
- React 组件支持 React 18，并可在 SSR 场景下安全渲染。
- 富文本选区恢复在可用时使用 `DOMParser`、`Selection` 和 `Range`；在浏览器外则回退到规范化纯文本。

## 安全默认值

- Markdown 不启用原始 HTML。
- KaTeX 渲染时关闭不可信 HTML 命令。
- 剪贴板序列化会遍历已有 DOM 树，不会把剪贴板 HTML 注入到当前文档。
- 宿主应用仍需在自己的 DOM API 之前，对 URL 和外部提供的 HTML 做清理。

详见 [docs/DESIGN.md](docs/DESIGN.md)、[SECURITY.md](SECURITY.md) 和
[docs/PUBLICATION_CHECKLIST.md](docs/PUBLICATION_CHECKLIST.md)。生产依赖许可证记录在
[docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)。

## 许可证

许可证选择仍在等待权利人批准。只要仓库里还没有 `LICENSE` 文件，就不应当把这里视为可再发布的软件。
