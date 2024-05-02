/*
 * Copyright 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

module.exports = {
  env: {
    node: true
  },
  extends: [
    'eslint-config-digitalbazaar',
    'eslint-config-digitalbazaar/jsdoc',
    'digitalbazaar/module',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'jsdoc/check-examples': 0,
    'max-len': ['error', {ignorePattern: '\\* SPDX-License-Identifier: ',
      ignoreUrls: true}]
  }
};
