# vcdm2-test-suite
Test Suite for Verifiable Credentials Data Model (VCDM) 2.0

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Implementation](#implementation)


## Background

Provides interoperability tests for verifable credential processors (issuers/verifiers) that support [vc-data-model-2.0](https://www.w3.org/TR/vc-data-model-2.0/).

## Install

```js
npm i
```

## Usage

```
npm test
```


## Implementation

### VC-API
To add your implementation to this test suite see the [README here](https://github.com/w3c-ccg/vc-api-test-suite-implementations).
Add the tag `vc-api` to the issuers and verifiers you want tested. To run the tests, some implementations require client secrets
that can be passed as env variables to the test script. To see which ones require client secrets, you can check the [vc-api-test-suite-implementations](https://github.com/w3c-ccg/vc-api-test-suite-implementations) library.

### Non-VC-API
TODO
