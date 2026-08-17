# Math Rich Editor Kit

A framework-agnostic TypeScript core and an optional React layer for math-aware copy, paste,
editing, validation, rendering, and answer interactions.

> Publication status: local staging draft. No redistribution license has been granted yet. The
> packages intentionally remain `private: true` until the rights owner approves a license and the
> publication checklist is complete.

## Packages

| Package                   | Purpose                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@math-rich-editor/core`  | LaTeX normalization and validation, rendered-math clipboard recovery, answer-step editing rules, choice grading, and stale-response guards. |
| `@math-rich-editor/react` | Safe KaTeX and Markdown rendering, formula input, accessible choices, answer-step editing, and math-aware copy helpers.                     |

The core package has no product, account, course, database, or network concepts. The React package
only depends on the core package and public rendering libraries.

## Design goals

- Preserve canonical LaTeX when users copy rendered KaTeX or MathML.
- Normalize common malformed math delimiters without rewriting ordinary prose.
- Keep incomplete formulas editable and render a readable fallback instead of crashing.
- Make stale async results and optimistic mutations explicit rather than relying on timing.
- Provide accessible, controlled React components without imposing application state management.
- Keep raw HTML disabled in Markdown rendering by default.

## Development

Requirements: Node.js 22+ and pnpm 10.

```bash
pnpm install
pnpm check
```

Run an individual package build:

```bash
pnpm --filter @math-rich-editor/core build
pnpm --filter @math-rich-editor/react build
```

An interactive synthetic-data example lives in `examples/basic` and is included in the workspace
build.

## Compatibility

- Published JavaScript targets ES2022 modules.
- The development toolchain requires Node.js 22 or newer.
- React components support React 18 and render safely during SSR.
- Rich selection recovery uses `DOMParser`, `Selection`, and `Range` when available and falls back
  to normalized plain text outside a browser.

## Security defaults

- Markdown does not enable raw HTML.
- KaTeX is rendered with untrusted HTML commands disabled.
- Clipboard serialization walks an existing DOM tree; it does not inject clipboard HTML into the
  live document.
- Consumers remain responsible for sanitizing URLs and externally supplied HTML before those
  values reach their own DOM APIs.

See [docs/DESIGN.md](docs/DESIGN.md), [SECURITY.md](SECURITY.md), and
[docs/PUBLICATION_CHECKLIST.md](docs/PUBLICATION_CHECKLIST.md). Production dependency licenses are
recorded in [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md).

## License

License selection is intentionally pending rights-owner approval. Until a `LICENSE` file is added,
this repository is not licensed for redistribution.
