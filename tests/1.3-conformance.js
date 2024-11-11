/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix} from './helpers.js';
import {checkRequiredProperties, shouldBeSecured} from './assertions.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {TestEndpoints} from './TestEndpoints.js';

const should = chai.should();

const require = createRequire(import.meta.url);

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});

// // 1.3 Conformance https://w3c.github.io/vc-data-model/#conformance
describe('Basic Conformance', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      let issuedVc;
      before(async function() {
        try {
          issuedVc = await endpoints.issue(require(
            './input/credential-ok.json'));
        } catch(e) {
          console.error(
            `Issuer: ${name} failed to issue "credential-ok.json".`,
            e
          );
        }
      });
      beforeEach(addPerTestMetadata);
      it('A conforming document MUST be secured by at least one securing ' +
        'mechanism as described in Section 4.12 Securing Mechanisms.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#securing-mechanisms:~:text=A%20conforming%20document%20MUST%20be%20secured%20by%20at%20least%20one%20securing%20mechanism%20as%20described%20in%20Section%204.12%20Securing%20Mechanisms.`;
        // covers both embedded and enveloped dynamically
        should.exist(issuedVc, `Expected ${name} to have issued a VC.`);
        shouldBeSecured(name, issuedVc);
      });
      it('A conforming issuer implementation MUST include all ' +
        'required properties in the conforming documents it produces.',
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20include%20all%20required%20properties%20in%20the%20conforming%20documents%20it%20produces`;
        should.exist(issuedVc, `Expected ${name} to have issued a VC.`);
        checkRequiredProperties(name, issuedVc);
      });
      it('A conforming issuer implementation MUST secure the ' +
        'conforming documents it produces using a securing mechanism' +
        'described in Section 4.12 Securing Mechanisms.',
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20include%20all%20required%20properties%20in%20the%20conforming%20documents%20it%20produces`;
        should.exist(issuedVc, `Expected ${name} to have issued a VC.`);
        shouldBeSecured(name, issuedVc);
      });
      it('A conforming verifier implementation MUST perform ' +
        'verification on a conforming document as described in' +
        'Section 4.12 Securing Mechanisms.',
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20include%20all%20required%20properties%20in%20the%20conforming%20documents%20it%20produces`;
        await assert.doesNotReject(endpoints.verify(issuedVc),
          'Failed to verify credential.');
      });
      it('A conforming verifier implementation MUST check ' +
        'that each required property satisfies the normative requirements' +
        'for that property.',
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20include%20all%20required%20properties%20in%20the%20conforming%20documents%20it%20produces`;
        this.test.cell.skipMessage = 'Tested by other tests in this suite.';
        this.skip();
      });
      it('A conforming verifier implementation MUST produce errors ' +
        'when non-conforming documents are detected.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=MUST%20produce%20errors%20when%20non%2Dconforming%20documents%20are%20detected.`;
        const doc = {
          type: ['NonconformingDocument']
        };
        await assert.rejects(endpoints.verify(doc),
          'Failed to reject malformed VC.');
        await assert.rejects(endpoints.verifyVp(doc),
          'Failed to reject malformed VP.');
      });
    });
  }
});
