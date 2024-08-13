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

// 4.3 Identifiers https://w3c.github.io/vc-data-model/#identifiers
describe('Identifiers', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If present, the value of the id property MUST be a single URL, ' +
        'which MAY be dereferenceable.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=If%20present%2C%20the%20value%20of%20the%20id%20property%20MUST%20be%20a%20single%20URL%2C%20which%20MAY%20be%20dereferenceable.`;
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-id-other-ok.json')),
        'Failed to accept a VC with a DID credentialSubject identifier.');
        await assert.rejects(
          endpoints.issue(require(
            './input/credential-id-nonidentifier-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a credential with a `null` identifier.');

        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-id-single-ok.json')),
        'Failed to accept a VC with a valid identifier.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-id-subject-single-ok.json')),
        'Failed to accept a VC with a valid credentialSubject identifier');
        await assert.rejects(endpoints.issue(require(
          './input/credential-id-multi-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with multiple `id` values.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-id-subject-multi-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with multiple credentialSubject identifiers.');

        await assert.rejects(
          endpoints.issue(require('./input/credential-id-not-url-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a credential with an invalid identifier.');
      });
    });
  }
});
