# Verifiable Credentials v2.0 Test Suite

This is the test suite for the W3C Verifiable Credentials Data Model (VCDM) v2.0
specification.

## Table of Contents

- [Verifiable Credentials v2.0 Test Suite](#verifiable-credentials-v20-test-suite)
  - [Table of Contents](#table-of-contents)
  - [Background](#background)
  - [Install](#install)
  - [Setup](#setup)
  - [Usage](#usage)
  - [Implementation](#implementation)
    - [VC-API](#vc-api)
    - [Docker (TODO)](#docker-todo)
  - [Contribute](#contribute)
  - [License](#license)

## Background

This test suite provides interoperability tests for verifiable credential
processors (issuers/verifiers) that support the
[W3C Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/).

## Install

```js
npm i
```

## Setup

In order to integrate with this test suite, you will need to use a
[VC API compatible](https://w3c-ccg.github.io/vc-api/) issuer and verifier that
is capable of issuing and verifying verifiable credentials and verifiable
presentations.

The issuer endpoint will need to conform to the
[VC Issuer API](https://w3c-ccg.github.io/vc-api/#issue-credential).

A request to issue a credential (`/credentials/issue`) will look like this:

```json
{
  "credential": {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://www.w3.org/ns/credentials/examples/v2"
    ],
    "id": "http://university.example/credentials/1872",
    "type": ["VerifiableCredential", "ExampleAlumniCredential"],
    "issuer": "https://university.example/issuers/565049",
    "validFrom": "2023-07-01T19:23:24Z",
    "credentialSubject": {
      "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
      "alumniOf": {
        "id": "did:example:c276e12ec21ebfeb1f712ebc6f1",
        "name": "Example University"
      }
    },
  },
  "options": {}
}
```

The response from a call to issue a credential (`/credentials/issue`) will
look like this:

```json
{
  "verifiableCredential": {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://www.w3.org/ns/credentials/examples/v2"
    ],
    "id": "http://university.example/credentials/1872",
    "type": ["VerifiableCredential", "ExampleAlumniCredential"],
    "issuer": "https://university.example/issuers/565049",
    "validFrom": "2023-07-01T19:23:24Z",
    "credentialSubject": {
      "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
      "alumniOf": {
        "id": "did:example:c276e12ec21ebfeb1f712ebc6f1",
        "name": "Example University"
      }
    },
    "proof": {
      "type": "DataIntegrityProof",
      "cryptosuite": "eddsa-2022",
      "created": "2023-06-18T21:19:10Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "https://university.example/issuers/565049#key-1",
      "proofValue": "zQeVbY4oey...V6doDwLWx"
    }
  }
}
```

The credential verifier endpoint will need to conform to the
[VC Verifier API](https://w3c-ccg.github.io/vc-api/#verify-credential).

A request to the verifier endpoint (`/credentials/verify`) for a credential
will look like this:

```json
{
  "verifiableCredential": {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://www.w3.org/ns/credentials/examples/v2"
    ],
    "id": "http://university.example/credentials/1872",
    "type": ["VerifiableCredential", "ExampleAlumniCredential"],
    "issuer": "https://university.example/issuers/565049",
    "validFrom": "2023-07-01T19:23:24Z",
    "credentialSubject": {
      "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
      "alumniOf": {
        "id": "did:example:c276e12ec21ebfeb1f712ebc6f1",
        "name": "Example University"
      }
    },
    "proof": {
      "type": "DataIntegrityProof",
      "cryptosuite": "eddsa-2022",
      "created": "2023-06-18T21:19:10Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "https://university.example/issuers/565049#key-1",
      "proofValue": "zQeVbY4oey...V6doDwLWx"
    }
  },
  "options": {}
}

```

A response from the verifier endpoint (`/credentials/verify`) for a
verifiable credential might look like this (only HTTP response codes are
checked):

```json
{
  "checks": ["proof"],
  "warnings": ["invalid-uri"],
  "errors": ["invalid proof"]
}
```

The presentation verifier endpoint will need to conform to the
[VC Verifier API](https://w3c-ccg.github.io/vc-api/#verify-presentation).

A request to the verifier endpoint for a presentation (`/presentations/verify`)
will look like this:

```json
{
  "verifiablePresentation": {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    "type": ["VerifiablePresentation"],
    "holder": "did:example:holder123456789",
    "verifiableCredential": [{
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://www.w3.org/ns/credentials/examples/v2"
      ],
      "id": "http://university.example/credentials/1872",
      "type": ["VerifiableCredential", "ExampleAlumniCredential"],
      "issuer": "https://university.example/issuers/565049",
      "validFrom": "2023-07-01T19:23:24Z",
      "credentialSubject": {
        "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
        "alumniOf": {
          "id": "did:example:c276e12ec21ebfeb1f712ebc6f1",
          "name": "Example University"
        }
      },
      "proof": {
        "type": "DataIntegrityProof",
        "cryptosuite": "eddsa-2022",
        "created": "2023-06-18T21:19:10Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "https://university.example/issuers/565049#key-1",
        "proofValue": "zQeVbY4oey...V6doDwLWx"
      }
    }],
    "proof": {
      "type": "DataIntegrityProof",
      "cryptosuite": "eddsa-2022",
      "challenge": "08cf4ce0-2bd0-11ee-8622-83054936f200",
      "domain": "example.com",
      "created": "2023-06-18T21:19:10Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:example:holder123456789#key-1",
      "proofValue": "zQeVbY4y...oDwLWxV6d"
    }
  },
  "options": {
    "challenge": "secret",
    "domain": "example.com"
  }
}
```

A response from the verifier endpoint (`/credentials/verify`) for a
verifiable presentation might look like this (only HTTP response codes are
checked):

```json
{
  "checks": ["proof"],
  "warnings": ["invalid-uri"],
  "errors": ["invalid proof"]
}
```

Implementations are expected to not error when any of the following context
files are used in a verifiable credential or a verifiable presentation:

- [VC 2.0 Context - https://www.w3.org/ns/credentials/v2](https://www.w3.org/ns/credentials/v2)
- [VC Examples Context - https://www.w3.org/ns/credentials/examples/v2](https://www.w3.org/ns/credentials/examples/v2)

## Usage

```
npm test
```

## Implementation

### VC-API
To add your implementation to this test suite You will need to add 3 endpoints to your implementation manifest.
- A credentials issuer endpoint (`/credentials/issue`) in the `issuers` property.
- A credentials verifier endpoint (`/credentials/verify`) in the `verifiers` property.
- A presentations verifier endpoint (`presentations/verify`) in the `vpVerifiers` property.

All endpoints will need the tag `vc2.0`. A simplified manifest will roughly
look like the following:

```js
{
  "name": "My Company",
  "implementation": "My implementation",
  "issuers": [{
    "id": "",
    "endpoint": "https://issuer.mycompany.com/credentials/issue",
    "method": "POST",
    "tags": ["vc2.0"]
  }],
  "verifiers": [{
    "id": "",
    "endpoint": "https://verifier.mycompany.com/credentials/verify",
    "method": "POST",
    "tags": ["vc2.0"]
  }],
  "vpVerifiers": [{
    "id": "",
    "endpoint": "https://verifier.mycompany.com/presentations/verify",
    "method": "POST",
    "tags": ["vc2.0"]
  }]
}
```

This example above is for a set of unauthenticated endpoints. You may add zcap
or oauth2 authentication to your endpoints.

See the [vc-test-suite-implementations README here](https://github.com/w3c/vc-test-suite-implementations).

To run the tests, some implementations require client secrets that can be passed
as env variables to the test script. To see which ones require client secrets,
you can check the
[vc-test-suite-implementations](https://github.com/w3c/vc-test-suite-implementations)
library.

### Docker (TODO)

We are currently adding a feature that would allow Docker images (using the VC
API above) to be used instead of live endpoints. The docker image that you
provide will be started when the test suite is run. The image is expected to
expose the API provided above, which will be utilized in the same way that live
HTTP endpoints are used above.

## Contribute

See [the CONTRIBUTING.md file](CONTRIBUTING.md).

Pull Requests are welcome!

## License

See [the LICENSE.md file](LICENSE.md)