# Design and package boundaries

## Core boundary

`@math-rich-editor/core` owns deterministic transformations and browser-DOM serialization. It must
not import React, application DTOs, API clients, authentication state, storage, or analytics.

Public capabilities are grouped by concern:

- math source normalization and delimiter handling;
- KaTeX-backed validation with structured issues;
- rendered DOM / selection serialization to Markdown and canonical LaTeX;
- answer-step text conversion and keyboard-boundary decisions;
- choice-answer normalization and grading;
- keyed mutation versions for rejecting stale asynchronous results.

## React boundary

`@math-rich-editor/react` owns controlled UI components. Components receive values and callbacks;
they do not fetch, persist, grade remotely, or assume a user/account model.

The package must remain usable with custom application state and custom CSS tokens. Public text is
English by default and may be overridden through props where it appears in controls.

## Security decisions

1. Markdown uses `react-markdown`, `remark-math`, and `rehype-katex` without `rehype-raw`.
2. KaTeX `trust` is disabled unless a future opt-in API documents an exact allowlist.
3. Rendered clipboard extraction ignores script/style nodes and accepts a configurable data
   attribute for canonical math source.
4. Formula validation returns issues; it never executes TeX or arbitrary HTML.
5. URL handling is fail-closed for unsafe protocols.

## Non-goals

- Collaborative editing or CRDT synchronization.
- A complete TeX parser.
- OCR, handwriting recognition, remote grading, or persistence.
- Product-specific question, course, account, or entitlement models.
