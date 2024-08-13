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

// 4.6 Credential Subject https://w3c.github.io/vc-data-model/#credential-subject
describe('Credential Subject', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('A verifiable credential MUST contain a credentialSubject property.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#credential-subject:~:text=A%20verifiable%20credential%20MUST%20contain%20a%20credentialSubject%20property.`;
          await assert.rejects(endpoints.issue(require(
            './input/credential-no-subject-fail.json')),
          {name: 'HTTPError'},
          'Failed to rejet a VC without a `credentialSubject`.');
        }
      );
      it('The value of the credentialSubject property is a set of objects ' +
        'where each object MUST be the subject of one or more claims, which ' +
        'MUST be serialized inside the credentialSubject property.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#credential-subject:~:text=The%20value%20of%20the%20credentialSubject%20property%20is%20a%20set%20of%20objects%20where%20each%20object%20MUST%20be%20the%20subject%20of%20one%20or%20more%20claims%2C%20which%20MUST%20be%20serialized%20inside%20the%20credentialSubject%20property.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-subject-no-claims-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with an empty `credentialSubject`.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-subject-multiple-ok.json')),
        'Failed to accept a VC with multiple `credentialSubject`s.');
        // TODO: reconsider whether an empty object is a violation; as long as
        // at least one claim object is included...is there any harm in throwing
        // out the empties?
        await assert.rejects(
          endpoints.issue(require(
            './input/credential-subject-multiple-empty-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject VC containing an empty `credentialSubject`.');
      });
    });
  }
});
