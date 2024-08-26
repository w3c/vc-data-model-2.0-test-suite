/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {
  addPerTestMetadata,
  includesAllRequiredProperties,
  isSecured,
  setupMatrix,
  trimText
} from './helpers.js';
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

// // 1.3 Conformance https://w3c.github.io/vc-data-model/#conformance
describe('Conformance', function() {
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
      it(trimText(`Conforming document (compliance): Sections 
        4. Basic Concepts, 5. Advanced Concepts, and 6. Syntaxes 
        of this document (VCDM 2.0 specification) MUST be enforced.`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#identifiers:~:text=of%20this%20document-,MUST%20be%20enforced.,-A%20conforming%20document`;
        this.test.cell.skipMessage = 'Tested by other tests in this suite.';
        this.skip();
      });
      it(trimText(`Verifiable Credential: A conforming document MUST be a 
        verifiable credential with a media type of application/vc`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=A%20conforming%20document%20MUST%20be%20either%20a%20verifiable%20credential%20with%20a%20media%20type%20of%20application/vc%20or%20a%20verifiable%20presentation%20with%20a%20media%20type%20of%20application/vp.`;
        this.test.cell.skipMessage = 'Tested by other tests in this suite.';
        this.skip();
      });
      it(trimText(`Verifiable Presentation: A conforming document MUST be a 
        verifiable presentation with a media type of application/vp.`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=A%20conforming%20document%20MUST%20be%20either%20a%20verifiable%20credential%20with%20a%20media%20type%20of%20application/vc%20or%20a%20verifiable%20presentation%20with%20a%20media%20type%20of%20application/vp.`;
        this.test.cell.skipMessage = 'Tested by other tests in this suite.';
        this.skip();
      });
      it(trimText(`A conforming document MUST be secured by at least one
        securing mechanism as described in Section 4.12 Securing Mechanisms.`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=A%20conforming%20document%20MUST%20be%20secured%20by%20at%20least%20one%20securing%20mechanism%20as%20described%20in%20Section%204.12%20Securing%20Mechanisms.`;
        isSecured(name, issuedVc);
      });
      it(trimText(`A conforming issuer implementation MUST include all
        required properties in the conforming documents it produces.`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20include%20all%20required%20properties%20in%20the%20conforming%20documents%20it%20produces`;
        includesAllRequiredProperties(issuedVc);
      });
      it(trimText(`A conforming issuer implementation MUST secure the
        conforming documents it produces using a securing mechanism
        described in Section 4.12 Securing Mechanisms.`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20secure%20the%20conforming%20documents%20it%20produces%20using%20a%20securing%20mechanism%20described%20in%20Section%204.12%20Securing%20Mechanisms.`;
        isSecured(name, issuedVc);
      });
      it(trimText(`A conforming verifier implementation MUST perform
        verification on a conforming document as described in
        Section 4.12 Securing Mechanisms.`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20perform%20verification%20on%20a%20conforming%20document%20as%20described%20in%20Section%204.12%20Securing%20Mechanisms`;
        await assert.doesNotReject(endpoints.verify(issuedVc),
          'Failed to verify credential.');
        // should reject a VC without a proof
        // TODO: VCs are not required to have a `proof` for verification; they
        // may be "enveloped" instead. Use test suite tags to determine? or
        // should we check media types?
        await assert.rejects(endpoints.verify(
          require('./input/credential-ok.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC missing a `proof`.');
        // TODO: add enveloped proof test
      });
      it(trimText(`A conforming verifier implementation MUST check
        that each required property satisfies the normative requirements
        for that property.`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20check%20that%20each%20required%20property%20satisfies%20the%20normative%20requirements%20for%20that%20property`;
      });
      it(trimText(`A conforming verifier implementation MUST produce errors
        when non-conforming documents are detected.`),
      async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#conformance:~:text=MUST%20produce%20errors%20when%20non%2Dconforming%20documents%20are%20detected`;
        const doc = {
          type: ['NonconformingDocument']
        };
        await assert.rejects(endpoints.verify(doc), {name: 'HTTPError'},
          'Failed to reject malformed VC.');
        await assert.rejects(endpoints.verifyVp(doc), {name: 'HTTPError'},
          'Failed to reject malformed VP.');
      });
    });
  }
});
