# 设计与包边界

## 核心边界

`@equakit/core` 负责确定性的转换和浏览器 DOM 序列化。它不能引入 React、应用层 DTO、API 客户端、认证状态、存储或埋点。

公开能力按职责分组如下：

- 数学源内容归一化和分隔符处理；
- 基于 KaTeX 的校验和结构化问题输出；
- 将渲染后的 DOM / 选区序列化为 Markdown 和规范化 LaTeX；
- 分步答案文本转换和键盘边界判定；
- 选择题答案归一化和判分；
- 使用键控变更版本拒绝过期的异步结果。

## React 边界

`@equakit/react` 负责受控 UI 组件。组件只接收值和回调，不负责拉取、持久化、远程判分，也不假定具体的用户或账号模型。

这个包必须继续支持自定义应用状态和自定义 CSS token。界面上的公开文案默认使用中文，并且在控件出现的位置可以通过 props 覆盖。

## Adapter 边界

`@equakit/adapter-mathlive` 只实现 `FormulaInputEditorComponent` 契约。MathLive 必须保持
peer dependency，并在浏览器挂载后动态加载，不能进入 `@equakit/react` 的默认依赖图。

Adapter 可以管理第三方编辑器的 DOM、选区和静态资源，但不能接管 `FormulaInput` 的校验、
预览、应用状态或远程持久化。MathLive 版本不得低于修复已知 HTML 转义问题的 `0.110.0`。

`@equakit/adapter-tiptap` 复用官方 Mathematics extension，不另建持久化 schema。TipTap、
ProseMirror 和 Mathematics 必须保持 peer dependency。Adapter 只固定安全 KaTeX 配置、
`data-latex` 剪贴板边界和迁移规则；React NodeView 仍由宿主应用按需提供。

## 安全决策

1. Markdown 使用 `react-markdown`、`remark-math` 和 `rehype-katex`，但不启用 `rehype-raw`。
2. 除非未来有明确的白名单式 opt-in API，否则关闭 KaTeX 的 `trust`。
3. 渲染后的剪贴板提取会忽略 `script` / `style` 节点，并接受可配置的数据属性作为规范数学源。
4. 公式校验只返回问题，不执行 TeX 或任意 HTML。
5. 对不安全协议的 URL 采取失败即拒绝的策略。

## 非目标

- 协作编辑或 CRDT 同步。
- 完整的 TeX 解析器。
- OCR、手写识别、远程判分或持久化。
- 具体到产品的题目、课程、账号或权益模型。
