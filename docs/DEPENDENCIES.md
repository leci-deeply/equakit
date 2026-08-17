# 生产依赖许可证

于 2026-08-17 使用以下命令审查：

```bash
pnpm licenses list --prod --json
```

已安装的生产依赖图只包含以下许可证家族：

- MIT
- ISC
- BSD-2-Clause

直接运行时依赖：

| 依赖                       | 作用                           | 许可证 |
| -------------------------- | ------------------------------ | ------ |
| KaTeX                      | LaTeX 解析与 HTML 渲染         | MIT    |
| React / React DOM          | 可选的 React 组件层            | MIT    |
| react-markdown             | Markdown 转 React 渲染         | MIT    |
| remark-math / rehype-katex | Markdown 数学解析与 KaTeX 转换 | MIT    |
| remark-gfm                 | GFM 表格、任务列表及相关语法   | MIT    |
| MathLive                   | 可选的结构化数学输入器         | MIT    |
| Cortex Compute Engine      | MathLive 的数学表达式依赖      | MIT    |
| TipTap / ProseMirror       | 可选的富文本数学节点与编辑内核 | MIT    |

EquaKit 自身采用 MIT License；依赖项继续遵循各自的许可证。完整授权文本见根目录
[`LICENSE`](../LICENSE)。
