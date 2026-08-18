# 设计与包边界

## 核心边界

EquaKit 的核心边界现在由一组原子包承担：`@equakit/math-text`、`@equakit/katex-engine`、
`@equakit/clipboard-restore`、`@equakit/clipboard-formats`、`@equakit/answer-steps`、
`@equakit/choice` 和 `@equakit/async-guard`。它们负责确定性的转换、校验、序列化和状态判定，
不能引入 React、应用层 DTO、API 客户端、认证状态、存储或埋点。

公开能力按职责分组如下：

- `math-text` 负责数学源内容归一化、分隔符处理和 token 提取；
- `katex-engine` 负责基于 KaTeX 的校验和结构化问题输出；
- `clipboard-restore` 负责将渲染后的 DOM / 选区序列化为 Markdown 和规范化 LaTeX；
- `clipboard-formats` 负责单公式数学剪贴板 payload；
- `answer-steps` 负责分步答案文本转换和键盘边界判定；
- `choice` 负责选择题答案归一化和判分；
- `async-guard` 负责使用键控变更版本拒绝过期的异步结果。

## React 边界

`@equakit/react-katex`、`@equakit/react-markdown-math`、`@equakit/react-formula-input`、
`@equakit/react-clipboard`、`@equakit/react-answer-steps` 和 `@equakit/react-choice` 负责受控 UI
组件。组件只接收值和回调，不负责拉取、持久化、远程判分，也不假定具体的用户或账号模型。

这些包必须继续支持自定义应用状态和自定义 CSS token。界面上的公开文案默认使用中文，并且在控件出现的位置可以通过 props 覆盖。

## Adapter 边界

`@equakit/mathlive-editor` 只实现 `FormulaInputEditorComponent` 契约。MathLive 必须保持 peer
dependency，并在浏览器挂载后动态加载，不能进入 `@equakit/react-formula-input` 的默认依赖图。

`mathlive-editor` 可以管理第三方编辑器的 DOM、选区和静态资源，但不能接管 `FormulaInput` 的
校验、预览、应用状态或远程持久化。MathLive 版本不得低于修复已知 HTML 转义问题的 `0.110.0`。

`@equakit/tiptap-math` 复用官方 Mathematics extension，不另建持久化 schema。TipTap、ProseMirror
和 Mathematics 必须保持 peer dependency。它只固定安全 KaTeX 配置、`data-latex` 剪贴板边界和
迁移规则；React NodeView 仍由宿主应用按需提供。

多格式剪贴板只处理单公式选区。`@equakit/clipboard-formats` 定义同步 converter 契约但不引入
转换引擎；`@equakit/react-clipboard` 在原生 copy 事件内写入全部可用 MIME；
`@equakit/mathlive-formats` 按需提供实际格式转换。混合正文
必须降级为 `text/plain`。

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
