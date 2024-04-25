<!--
Copyright 2024 Digital Bazaar, Inc.

SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
-->

# w3c/vc-data-model-2.0-test-suite ChangeLog

## 1.1.0 - 2024-01-xx

### Added
- Add new tests for `issuer.name` including Internationalization settings.
- Add a new test to ensure type URLs are treated as an unordered set.
- Add new tests for `issuer.description` including Internationalization settings.
- Add new tests for `issuer.id` as a url and not a url.
- Add tests for interactions between `validFrom ` and `validUntil`.
- Expand tests for `credentialStatus.{id, type}`.

### Fixed
- Update statement for `credentialStatus.id` and `type` test.
- Update statement for `credentialSchemas` test.
- `credentialStatus.id` is now optional.
- Update `vc-api-test-suite-implementations` to `vc-test-suite-implementations`.

## 1.0.0 - 2023-11-10

### Added
- Add a new reporter option that generates the JSON used to create the report.

### Changed
- Use `@digitalbazaar/mocha-w3c-interop-reporter@1.5.0`.

## Before 1.0.0

- See git history for changes.
