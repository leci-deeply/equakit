# Publication checklist

## Legal and ownership — blocking

- [ ] Written approval from the code rights owner.
- [ ] Confirm contributor attribution requirements.
- [ ] Select and add an approved open-source license.
- [ ] Review names and package scopes for trademark conflicts.
- [ ] Confirm that no third-party content or private fixtures were copied.

## Redaction — blocking

- [x] Search tracked files for internal organization/product names.
- [x] Search for domains, IP addresses, emails, tokens, credentials, bucket names, and service IDs.
- [x] Inspect generated bundles, source maps, lockfiles, examples, snapshots, and test output.
- [x] Confirm Git history begins in this repository and contains no private parent commits.
- [x] Confirm examples use synthetic English data.

## Engineering quality

- [x] `pnpm check` passes on a clean checkout.
- [x] Package tarballs contain only intended files (`npm pack --dry-run --json`).
- [x] Public APIs have README examples and declaration files.
- [x] Browser support and Node.js support are documented.
- [x] Security-sensitive Markdown, URL, HTML, and clipboard paths have tests.
- [x] A production dependency license report has been reviewed.

## Release

- [ ] Remove `private: true` only after all blocking items pass.
- [ ] Add repository, bugs, homepage, author/maintainer, and funding metadata.
- [ ] Choose the final package scope and verify registry ownership.
- [ ] Enable branch protection, required CI, Dependabot/Renovate, and secret scanning.
- [ ] Create a signed `v0.1.0` tag and attach generated provenance if required.
