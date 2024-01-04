# w3c/vc-data-model-2.0-test-suite ChangeLog

## 1.1.0 -

### Added
- Add new tests for `issuer.name` including Internationalization settings.
- Add a new test to ensure type URLs are treated as an unordered set.
- Add new tests for `issuer.description` including Internationalization settings.
- Add new tests for `issuer.id` as a url and not a url.
- Add tests for interactions between `validFrom ` and `validUntil`.

### Fixed
- Update statement for credentialStatus id & type test.
- Update statement for credentialSchemas test.

## 1.0.0 - 2023-11-10

### Added
- Add a new reporter option that generates the JSON used to create the report.

### Changed
- Use `@digitalbazaar/mocha-w3c-interop-reporter@1.5.0`.

## Before 1.0.0

- See git history for changes.
