/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, extractIfEnveloped, setupMatrix}
  from './helpers.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {shouldBeCredential} from './assertions.js';
import {TestEndpoints} from './TestEndpoints.js';

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const require = createRequire(import.meta.url);

const tag = 'EnvelopingProof';
const {match} = filterByTag({tags: [tag]});

// 4.12.1 Enveloped Verifiable Credentials https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials
describe('VP - Enveloped Verifiable Credentials', function() {
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

      it('The @context property of the object MUST be present and include a ' +
        'context, such as the base context for this specification, that ' +
        'defines at least the id, type, and EnvelopedVerifiableCredential ' +
        'terms as defined by the base context provided by this specification.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20%40context%20property%20of%20the%20object%20MUST%20be%20present%20and%20include%20a%20context%2C%20such%20as%20the%20base%20context%20for%20this%20specification%2C%20that%20defines%20at%20least%20the%20id%2C%20type%2C%20and%20EnvelopedVerifiableCredential%20terms%20as%20defined%20by%20the%20base%20context%20provided%20by%20this%20specification.`;
        await assert.doesNotReject(endpoints.verifyVp(require(
          './input/presentation-enveloped-vc-ok.json')),
        'Failed to accept a VP containing a enveloped VC.');
        // TODO: add more `@context` variations to test handling?
        await assert.rejects(endpoints.verifyVp(require(
          './input/presentation-enveloped-vc-missing-required-type-fail.json')),
        'Failed to reject a VP containing an enveloped VC with a missing ' +
        '`type`.');
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable credential using an enveloping ' +
        'security scheme, such as Securing Verifiable Credentials using JOSE ' +
        'and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20credential%20using%20an%20enveloping%20security%20scheme%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;
        issuedVc.should.have.property('id').that.does
          .include('data:',
            `Expecting id field to be a 'data:' scheme URL [RFC2397].`);
        const extractedCredential = extractIfEnveloped(issuedVc);
        shouldBeCredential(extractedCredential);
      });

      it('The type value of the object MUST be EnvelopedVerifiableCredential.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiableCredential.`;
          issuedVc.should.have.property('type').that.does
            .include('EnvelopedVerifiableCredential',
              `Expecting type field to be EnvelopedVerifiableCredential`);
        });
    });
  }
});

// 4.12.2 Enveloped Verifiable Presentations https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations
describe('VP - Enveloped Verifiable Presentations', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      let createdVp;
      before(async function() {
        try {
          createdVp = await endpoints.createVp({
            presentation: require('./input/presentation-vc-ok.json')
          });
        } catch(e) {
          console.error(
            `Holder: ${name} failed to create "presentation-vc-ok.json".`,
            e
          );
        }
      });
      beforeEach(addPerTestMetadata);

      it('The @context property of the object MUST be present and include a ' +
        'context, such as the base context for this specification, that ' +
        'defines at least the id, type, and EnvelopedVerifiablePresentation ' +
        'terms as defined by the base context provided by this specification.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20%40context%20property%20of%20the%20object%20MUST%20be%20present%20and%20include%20a%20context%2C%20such%20as%20the%20base%20context%20for%20this%20specification%2C%20that%20defines%20at%20least%20the%20id%2C%20type%2C%20and%20EnvelopedVerifiablePresentation%20terms%20as%20defined%20by%20the%20base%20context%20provided%20by%20this%20specification.`;
        // TODO: implement test, dynamic presentation from issued
        this.test.cell.skipMessage = 'Missing Enveloped VP';
        this.skip();
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable presentation using an enveloping ' +
        'securing mechanism, such as Securing Verifiable Credentials using ' +
        'JOSE and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20presentation%20using%20an%20enveloping%20securing%20mechanism%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;
        this.test.cell.skipMessage = 'Missing Enveloped VP';
        this.skip();
        createdVp.should.have.property('id').that.does
          .include('data:application/vp+jwt',
            `Expecting id field to be a 'data:' scheme URL [RFC2397].`);
        // TODO extract and test Presentation
      });

      it('The type value of the object MUST be ' +
        'EnvelopedVerifiablePresentation.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiablePresentation.`;
        this.test.cell.skipMessage = 'Missing Enveloped VP';
        this.skip();
        createdVp.should.have.property('type').that.does
          .include('EnvelopedVerifiablePresentation',
            `Expecting type field to be EnvelopedVerifiablePresentation`);
      });
    });
  }
});
