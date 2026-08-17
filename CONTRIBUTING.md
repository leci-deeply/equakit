# Contributing

The project is currently a private publication draft. Contributions should preserve the package
boundaries and security defaults documented in `docs/DESIGN.md`.

Before submitting a change:

```bash
pnpm check
```

Requirements:

- add focused tests for behavior changes;
- keep fixtures synthetic and free of organization/product references;
- do not enable raw HTML or broad KaTeX trust callbacks;
- avoid application DTOs, API clients, analytics, and account state;
- document public API changes in package READMEs.
