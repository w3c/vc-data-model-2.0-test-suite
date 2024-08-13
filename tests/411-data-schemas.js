/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix} from './helpers.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {TestEndpoints} from './TestEndpoints.js';

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const require = createRequire(import.meta.url);

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});

// 4.11 Data Schemas https://w3c.github.io/vc-data-model/#data-schemas
describe('Data Schemas', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('The value of the credentialSchema property MUST be one or more ' +
        'data schemas that provide verifiers with enough information to ' +
        'determine whether the provided data conforms to the provided ' +
        'schema(s).', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=The%20value%20of%20the%20credentialSchema%20property%20MUST%20be%20one%20or%20more%20data%20schemas%20that%20provide%20verifiers%20with%20enough%20information%20to%20determine%20whether%20the%20provided%20data%20conforms%20to%20the%20provided%20schema(s).`;
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-schema-ok.json')),
        'Failed to accept a VC containing a valid `credentialSchema`.');
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-schemas-ok.json')),
        'Failed to accept a VC containing multiple valid `credentialSchema`.');
      });

      it('Each credentialSchema MUST specify its type (for example, ' +
        'JsonSchema), and an id property that MUST be a URL identifying the ' +
        'schema file.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=Each%20credentialSchema%20MUST%20specify%20its%20type%20(for%20example%2C%20JsonSchema)%2C%20and%20an%20id%20property%20that%20MUST%20be%20a%20URL%20identifying%20the%20schema%20file.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-schema-no-type-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject `credentialSchema` without a `type`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-schema-no-id-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject `credentialSchema` without an `id`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-schema-non-url-id-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject `credentialSchema` with a numerid `id`.');
      });

      it('If multiple schemas are present, validity is determined according ' +
        'to the processing rules outlined by each associated ' +
        'credentialSchema type property.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=If%20multiple%20schemas%20are%20present%2C%20validity%20is%20determined%20according%20to%20the%20processing%20rules%20outlined%20by%20each%20associated%20credentialSchema%20type%20property.`;
        // TODO: this doesn't really test the above statement...
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-schemas-ok.json')),
        'Failed to accept a VC containing multiple valid `credentialSchema`.');
      });
    });
  }
});
