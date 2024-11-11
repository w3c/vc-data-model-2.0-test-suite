/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix} from './helpers.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createLocalVp} from './data-generator.js';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {TestEndpoints} from './TestEndpoints.js';

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const require = createRequire(import.meta.url);

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});

// 4.3 Contexts https://w3c.github.io/vc-data-model/#contexts
describe('Algorithms', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('This section contains an algorithm that conforming ' +
        'verifier implementations MUST run when verifying a ' +
        'verifiable credential or a verifiable presentation.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20include%20a%20%40context%20property.`;

        const vc = await endpoints.issue(require(
          './input/credential-ok.json'));
        await assert.doesNotReject(endpoints.verify(vc),
          'Failed to verify a valid VC.');

        const vp = await createLocalVp({
          presentation: require('./input/presentation-ok.json')
        });
        await assert.doesNotReject(endpoints.verifyVp(vp),
          'Failed to verify a valid VP.');

        vp.proof.proofValue = 'z5nmMBw2u9TGKd9NxxHJtyZKgjN2Eh';
        await assert.rejects(endpoints.verifyVp(vp),
          'Failed to reject an invalid VP.');

        // TODO add negative tests
      });
      // TODO add problem details tests
    });
  }
});
