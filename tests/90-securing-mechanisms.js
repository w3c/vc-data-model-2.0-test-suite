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

// 4.9 Securing Mechanisms https://w3c.github.io/vc-data-model/#securing-mechanisms
describe('Securing Mechanisms', function() {
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

      // as of VC 2.0 this means a proof must be attached to an issued VC
      // at least one proof must be on an issued VC
      // TODO: maybe move this up to the 1.3 Conformance section it's from?
      it('A conforming document MUST be secured by at least one securing ' +
        'mechanism as described in Section 4.12 Securing Mechanisms.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#securing-mechanisms:~:text=A%20conforming%20document%20MUST%20be%20secured%20by%20at%20least%20one%20securing%20mechanism%20as%20described%20in%20Section%204.12%20Securing%20Mechanisms.`;
        // embedded proof test
        issuedVc.should.have.property('type').that.does
          .include('VerifiableCredential', `Expected ${name} to issue a VC.`);
        issuedVc.should.have.property('proof').which.is.not.a('string',
          'Expected VC to have a `proof`.');
        if(Array.isArray(issuedVc.proof)) {
          issuedVc.proof.length.should.be.gt(0,
            'Expected at least one `proof`.');
          issuedVc.proof.every(p => typeof p === 'object').should.be.true;
        } else {
          issuedVc.proof.should.be.an(
            'object',
            'Expected `proof` to be an object.'
          );
        }
        // TODO: add enveloped proof test
      });
      it('A conforming issuer implementation produces conforming ' +
        'documents, MUST include all required properties in the conforming ' +
        'documents that it produces, and MUST secure the conforming ' +
        'documents it produces using a securing mechanism as described in ' +
        'Section 4.12 Securing Mechanisms.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#securing-mechanisms:~:text=A%20conforming%20issuer%20implementation%20produces%20conforming%20documents%2C%20MUST%20include%20all%20required%20properties%20in%20the%20conforming%20documents%20that%20it%20produces%2C%20and%20MUST%20secure%20the%20conforming%20documents%20it%20produces%20using%20a%20securing%20mechanism%20as%20described%20in%20Section%204.12%20Securing%20Mechanisms.`;
        // TODO: check "all required properties" (use a shared function)
        issuedVc.should.have.property('type').that.does
          .include('VerifiableCredential', `Expected ${name} to issue a VC.`);
        issuedVc.should.have.property('proof').which.is.not.a('string',
          'Expected VC to have a `proof`.');
        // TODO: add enveloped proof test
      });
      it('A conforming verifier implementation consumes conforming ' +
        'documents, MUST perform verification on a conforming document as ' +
        'described in Section 4.12 Securing Mechanisms, MUST check that each ' +
        'required property satisfies the normative requirements for that ' +
        'property, and MUST produce errors when non-conforming documents are ' +
        'detected.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#securing-mechanisms:~:text=A%20conforming%20verifier,documents%20are%20detected.`;
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
    });
  }
});
