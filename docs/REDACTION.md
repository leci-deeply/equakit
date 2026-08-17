# Redaction record

This project is a clean-room-style secondary edit of reusable engineering patterns from a private
production codebase. It is intentionally stored in a new Git repository with no imported history.

## Removed boundaries

- organization, product, book, course, exam, and assistant names;
- internal package scopes, domains, IP addresses, API routes, error codes, and environment names;
- production content, images, subtitles, prompts, fixtures, database models, and deployment files;
- authentication, entitlement, analytics, and user identifiers;
- cloud-vendor upload and storage adapters.

## Renamed concepts

- internal formula marker attributes become configurable, with `data-math-source` as the default;
- problem-specific answer types become generic answer-step and choice types;
- application-specific mutation keys become caller-owned string keys;
- product wording becomes overridable component labels.

## History rule

Do not merge, subtree-add, or filter the private repository into this repository. Public releases
must contain only this clean history. Provenance and copyright attribution must be reviewed by the
rights owner before publication.
