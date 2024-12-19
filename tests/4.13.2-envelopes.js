/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {
  addPerTestMetadata,
  generateCredential,
  generateEnvelope,
  secureCredential,
  setupMatrix,
  verifyCredential,
  verifyPresentation
} from './helpers.js';
import {
  vc_jwt,
  vp_jwt
} from './fixtures.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {filterByTag} from 'vc-test-suite-implementations';

const should = chai.should();

const tag = 'EnvelopingProof';
const {match} = filterByTag({tags: [tag]});

// 4.12.1 Enveloped Verifiable Credentials https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials
describe('Enveloped Verifiable Credentials', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const issuer = implementation.issuers?.find(
      issuer => issuer.tags.has(tag)) || null;
    const verifier = implementation.verifiers?.find(
      verifier => verifier.tags.has(tag)) || null;

    describe(name, function() {
      let verifiableCredential;
      let negativeFixture;
      before(async function() {
        verifiableCredential = generateEnvelope({
          type: 'EnvelopedVerifiableCredential',
          id: `data:application/vc+jwt,${vc_jwt}`
        });
      });
      beforeEach(addPerTestMetadata);

      it('The @context property of the object MUST be present and include a ' +
        'context, such as the base context for this specification, that ' +
        'defines at least the id, type, and EnvelopedVerifiableCredential ' +
        'terms as defined by the base context provided by this specification.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20%40context%20property%20of%20the%20object%20MUST%20be%20present%20and%20include%20a%20context%2C%20such%20as%20the%20base%20context%20for%20this%20specification%2C%20that%20defines%20at%20least%20the%20id%2C%20type%2C%20and%20EnvelopedVerifiableCredential%20terms%20as%20defined%20by%20the%20base%20context%20provided%20by%20this%20specification.`;
        if(issuer) {
          const issuedVc = await secureCredential(
            {issuer, credential: generateCredential()});
          should.exist(issuedVc, 'Expected credential to be issued.');
          issuedVc.should.have.property('@context');
          verifiableCredential = issuedVc;
        }
        if(verifier) {
          await assert.doesNotReject(
            verifyCredential({verifier, verifiableCredential}),
            'Failed to accept an enveloped VC.');

          // Replace context with an empty array
          negativeFixture = structuredClone(verifiableCredential);
          negativeFixture['@context'] = [];
          await assert.rejects(
            verifyCredential({verifier, negativeFixture}),
            'Failed to reject an enveloped VC with invalid context.');

          // Replace context with an invalid value
          negativeFixture = structuredClone(verifiableCredential);
          negativeFixture['@context'] = 'https://www.w3.org/ns/credentials/examples/v2';
          await assert.rejects(
            verifyCredential({verifier, negativeFixture}),
            'Failed to reject an enveloped VC with invalid context.');
        }
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable credential using an enveloping ' +
        'security scheme, such as Securing Verifiable Credentials using JOSE ' +
        'and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20credential%20using%20an%20enveloping%20security%20scheme%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;
        if(issuer) {
          const issuedVc = await secureCredential(
            {issuer, credential: generateCredential()});
          should.exist(issuedVc, 'Expected credential to be issued.');
          issuedVc.should.have.property('@context');
          verifiableCredential = issuedVc;
        }
        if(verifier) {
          await assert.doesNotReject(
            verifyCredential({verifier, verifiableCredential}),
            'Failed to accept an enveloped VC.');

          // Remove data uri portion of the id field
          negativeFixture = structuredClone(verifiableCredential);
          negativeFixture.id = negativeFixture.id.split(',').pop();
          await assert.rejects(
            verifyCredential({verifier, negativeFixture}),
            'Failed to reject an enveloped VC with an invalid data url id.');
        }
      });

      it('The type value of the object MUST be EnvelopedVerifiableCredential.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiableCredential.`;
          if(issuer) {
            const issuedVc = await secureCredential(
              {issuer, credential: generateCredential()});
            should.exist(issuedVc, 'Expected credential to be issued.');
            issuedVc.should.have.property('@context');
            verifiableCredential = issuedVc;
          }
          if(verifier) {
            await assert.doesNotReject(
              verifyCredential({verifier, verifiableCredential}),
              'Failed to accept an enveloped VC.');

            // Remove type field
            negativeFixture = structuredClone(verifiableCredential);
            delete negativeFixture.type;
            await assert.rejects(
              verifyCredential({verifier, negativeFixture}),
              'Failed to reject an enveloped VC with an enveloped VC with a ' +
              'missing `type`.');

            // Replace type field
            negativeFixture = structuredClone(verifiableCredential);
            negativeFixture.type = 'VerifiableCredential';
            await assert.rejects(
              verifyCredential({verifier, negativeFixture}),
              'Failed to reject an enveloped VC with an ' +
              'invalid `type`.');
          }
        });
    });
  }
});

// 4.12.2 Enveloped Verifiable Presentations https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations
describe('Enveloped Verifiable Presentations', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const vpVerifier = implementation.vpVerifiers?.find(
      vpVerifier => vpVerifier.tags.has(tag)) || null;

    describe(name, function() {
      let verifiablePresentation;
      let negativeFixture;
      before(async function() {
        verifiablePresentation = generateEnvelope({
          type: 'EnvelopedVerifiablePresentation',
          id: `data:application/jwt,${vp_jwt}`
        });
      });
      beforeEach(addPerTestMetadata);

      it('The @context property of the object MUST be present and include a ' +
        'context, such as the base context for this specification, that ' +
        'defines at least the id, type, and EnvelopedVerifiablePresentation ' +
        'terms as defined by the base context provided by this specification.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20%40context%20property%20of%20the%20object%20MUST%20be%20present%20and%20include%20a%20context%2C%20such%20as%20the%20base%20context%20for%20this%20specification%2C%20that%20defines%20at%20least%20the%20id%2C%20type%2C%20and%20EnvelopedVerifiablePresentation%20terms%20as%20defined%20by%20the%20base%20context%20provided%20by%20this%20specification.`;

        if(vpVerifier) {
          await assert.doesNotReject(
            verifyPresentation({vpVerifier, verifiablePresentation}),
            'Failed to accept an enveloped VP.');

          // Replace context field with empty array
          negativeFixture = structuredClone(verifiablePresentation);
          negativeFixture['@context'] = [];
          await assert.rejects(
            verifyPresentation({vpVerifier, negativeFixture}),
            'Failed to reject Enveloped VP missing contexts.');

          // Replace context field with invalid context
          negativeFixture = structuredClone(verifiablePresentation);
          negativeFixture['@context'] = ['https://www.w3.org/ns/credentials/examples/v2'];
          await assert.rejects(
            verifyPresentation({vpVerifier, negativeFixture}),
            'Failed to reject Enveloped VP missing contexts.');
        }
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable presentation using an enveloping ' +
        'securing mechanism, such as Securing Verifiable Credentials using ' +
        'JOSE and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20presentation%20using%20an%20enveloping%20securing%20mechanism%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;

        if(vpVerifier) {
          await assert.doesNotReject(
            verifyPresentation({vpVerifier, verifiablePresentation}),
            'Failed to accept an enveloped VP.');

          // Remove data uri portion from id field
          negativeFixture = structuredClone(verifiablePresentation);
          negativeFixture.id = negativeFixture.id.split(',').pop();
          await assert.rejects(
            verifyPresentation({vpVerifier, negativeFixture}),
            'Failed to reject Enveloped VP with an id that is not a data url.');
        }
      });

      it('The type value of the object MUST be ' +
        'EnvelopedVerifiablePresentation.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiablePresentation.`;

        if(vpVerifier) {
          await assert.doesNotReject(
            verifyPresentation({vpVerifier, verifiablePresentation}),
            'Failed to accept an enveloped VP.');

          // Replace type field
          negativeFixture = structuredClone(verifiablePresentation);
          negativeFixture.type = ['VerifiablePresentation'];
          await assert.rejects(
            verifyPresentation({vpVerifier, negativeFixture}),
            'Failed to reject VP w/o type "EnvelopedVerifiablePresentation".');
        }
      });
    });
  }
});
