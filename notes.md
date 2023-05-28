# Special rules this test suite implements

## Contexts

Various contexts are defined in [contexts.json](../contexts.json) in this test suite repository,
along with subsets of contexts that are normatively defined elsewhere (e.g. the
Credentials base context) as needed for the example server in this repository.

Implementations should define the following contexts as in this `contexts.json`:
- <https://example.org/ns/test-credential-pre>
- <https://example.org/ns/test-credential>
- <https://example.org/ns/test-credential-post>

## Application-specific context order

This is an example of a set of order-sensitive `@context` values.
Their order should be checked in the `@context` array.
These may or may not have expanded context data defined.

1. <https://example.org/specific-application/pre>
2. <https://example.org/specific-application/post>

## Type-specific context order

This is an example of a set of order-sensitive `@context` values for a credential type.

### ExampleOrderTestVerifiableCredential

IRI/URL: <https://example.org/examples#ExampleOrderTestVerifiableCredential>

Order:
1. <https://example.org/ns/test-credential-pre> (must appear first in this set)
2. <https://example.org/ns/test-credential> (defines this credential type)
3. <https://example.org/ns/test-credential-post> (must appear last in this set)

This test is intended to be passable by both JSON-based and JSON-LD-based processors.
