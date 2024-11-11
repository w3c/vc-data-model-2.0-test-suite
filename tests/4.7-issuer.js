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

// 4.7 Issuer https://w3c.github.io/vc-data-model/#issuer
describe('Issuer', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('A verifiable credential MUST have an issuer property.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#issuer:~:text=A%20verifiable%20credential%20MUST%20have%20an%20issuer%20property.`;
          const vc = await endpoints.issue(
            require('./input/credential-ok.json'));
          vc.hasOwnProperty('issuer');
        });
      it('The value of the issuer property MUST be either a URL or an ' +
        'object containing an id property whose value is a URL; ' +
        'in either case, the issuer selects this URL to identify itself in a ' +
        'globally unambiguous way.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#issuer:~:text=The%20value%20of%20the%20issuer%20property%20MUST%20be%20either%20a%20URL%2C%20or%20an%20object%20containing%20an%20id%20property%20whose%20value%20is%20a%20URL`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-issuer-object-ok.json')));
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-no-url-fail.json')),

        'Failed to reject an issuer identifier that was not a URL.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-null-fail.json')),

        'Failed to reject a null issuer identifier.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-object-id-null-fail.json')),

        'Failed to reject an issuer object containing a null identifier.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-object-id-no-url-fail.json')),

        'Failed to reject an issuer object containing a non-URL identifier.');
      });
    });
  }
});
