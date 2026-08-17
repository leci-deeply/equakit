# Production dependency licenses

Reviewed on 2026-08-16 with:

```bash
pnpm licenses list --prod --json
```

The installed production dependency graph contains only these license families:

- MIT
- ISC
- BSD-2-Clause

Direct runtime dependencies:

| Dependency                 | Purpose                                        | License |
| -------------------------- | ---------------------------------------------- | ------- |
| KaTeX                      | LaTeX parsing and HTML rendering               | MIT     |
| React / React DOM          | Optional React component layer                 | MIT     |
| react-markdown             | Markdown-to-React rendering                    | MIT     |
| remark-math / rehype-katex | Markdown math parsing and KaTeX transformation | MIT     |
| remark-gfm                 | GFM tables, task lists, and related syntax     | MIT     |

This inventory does not select a license for this repository. The project license remains blocked
on rights-owner approval.
