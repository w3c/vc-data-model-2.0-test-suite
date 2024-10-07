<!--
Copyright 2024 Digital Bazaar, Inc.

SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
-->

# Verifiable Credentials v2.0 Test Suite

This is the test suite for the W3C Verifiable Credentials Data Model (VCDM) v2.0
specification.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Setup](#setup)
- [Usage](#usage)
  - [Testing Locally](#testing-locally)
  - [Allure Reporting](#allure-reporting)
- [Implementation](#implementation)
  - [VC-API](#vc-api)
  - [Enveloping Proof](#enveloping-proof)
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

To integrate with this test suite, you will need a
[VC-API compatible](https://w3c-ccg.github.io/vc-api/) issuer and verifier that
are capable of issuing and verifying verifiable credentials and verifiable
presentations. If your implementation is not VC-API compatible, it is possible
to "wrap" the implementation in a minimal VC-API implementation, example code
for which is available at <https://github.com/Wind4Greg/Server-for-VCs>.
Additionally, your verifier will need to be able to verify Verifiable Credentials
and Verifiable Presentations signed with `eddsa-rdfc-2022`. We recommend
that any issuer endpoints submitted to this test suite also issue using
`eddsa-rdfc-2022`. Both signed and unsigned Verifiable Presentations will
be submitted for verification. Signed Verifiable Presentations from this suite
will have a domain and challenge set. The domain should be the test repo, and
the challenge is static.

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
    }
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
      "cryptosuite": "eddsa-rdfc-2022",
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
      "cryptosuite": "eddsa-rdfc-2022",
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
        "cryptosuite": "eddsa-rdfc-2022",
        "created": "2023-06-18T21:19:10Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "https://university.example/issuers/565049#key-1",
        "proofValue": "zQeVbY4oey...V6doDwLWx"
      }
    }],
    "proof": {
      "type": "DataIntegrityProof",
      "cryptosuite": "eddsa-rdfc-2022",
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

```sh
npm test
```

### Testing Locally

To test a single implementation or endpoint running locally, you can
copy `localConfig.example.cjs` to `localConfig.cjs`
in the root directory of the test suite.

```bash
cp localConfig.example.cjs localConfig.cjs
```

This file must be a CommonJS module that exports an object containing a
`settings` object (for configuring the test suite code itself) and an
`implementations` array (for configuring the implementation(s) to test against).

The format of the object contained in the `implementations` array is
identical to the one defined in
[the **_Testing locally_** section of VC Test Suite Implementations](https://github.com/w3c/vc-test-suite-implementations?tab=readme-ov-file#testing-locally).
The `implementations` array may contain more than one implementation object,
enabling you to test multiple implementations in one run.

```js
// localConfig.cjs defines local implementations
// Before running the tests, you can specify a BASE_URL, such as
// BASE_URL=http://localhost:40443/zDdfsdfs npm test
const baseUrl = process.env.BASE_URL || 'https://localhost:40443/id';
module.exports = {
  settings: {
    enableInteropTests: false, // default
    testAllImplementations: false // default
  },
  implementations: [{
    name: 'My Company',
    implementation: 'My Implementation Name',
    issuers: [{
      id: 'did:myMethod:implementation:issuer:id',
      endpoint: `${baseUrl}/credentials/issue`
    }],
    verifiers: [{
      id: 'did:myMethod:implementation:verifier:id',
      endpoint: `${baseUrl}/credentials/verify`
    }]
  }];
```

### Allure Reporting
It's also possible to generate local allure reports for analyzing and debugging results. [Allure](https://allurereport.org/) is a language agnostic reporting framework which enables useful features for developers and test-suite designers.

To run the tests and browse the report, use the following commands:
```bash
# Running the tests
npx mocha tests/

# Running the reporting server
allure serve allure-results
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
    "tags": ["vc2.0"]
  }],
  "verifiers": [{
    "id": "",
    "endpoint": "https://verifier.mycompany.com/credentials/verify",
    "tags": ["vc2.0"]
  }],
  "vpVerifiers": [{
    "id": "",
    "endpoint": "https://verifier.mycompany.com/presentations/verify",
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

### Enveloping Proof
Implementers who rely on an enveloping proof securing mechanism can add the `EnvelopingProof` tag to their implementation registration.

This will instruct the test suite to conduct further testing on the implementation and assert the Data Model based on the payload instead of the direct output.

```json
{
  "name": "My Company",
  "implementation": "My implementation",
  "issuers": [{
    "id": "",
    "endpoint": "https://issuer.mycompany.com/credentials/issue",
    "tags": ["vc2.0", "EnvelopingProof"]
  }],
  "verifiers": [{
    "id": "",
    "endpoint": "https://verifier.mycompany.com/credentials/verify",
    "tags": ["vc2.0", "EnvelopingProof"]
  }],
  "vpVerifiers": [{
    "id": "",
    "endpoint": "https://verifier.mycompany.com/presentations/verify",
    "tags": ["vc2.0", "EnvelopingProof"]
  }]
}
```

## Contribute

See [the CONTRIBUTING.md file in the `w3c/vc-test-suite-implementations` repo](https://github.com/w3c/vc-test-suite-implementations/blob/main/CONTRIBUTING.md).

Pull Requests are welcome!

## License

See [the LICENSE.md file](LICENSE.md)
