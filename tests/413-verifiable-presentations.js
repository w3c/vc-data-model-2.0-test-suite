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

// 4.11 Verifiable Credentials https://w3c.github.io/vc-data-model/#verifiable-credentials
// There are no actual MUSTs here, just references to other sections.

// 4.12 Verifiable Presentations https://w3c.github.io/vc-data-model/#verifiable-presentations
describe('Verifiable Presentations', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If [the `id` field is] present, the normative guidance in Section ' +
        '4.3 Identifiers MUST be followed.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=verifiable%20presentation.-,If%20present%2C%20the%20normative%20guidance%20in%20Section%204.3%20Identifiers%20MUST%20be%20followed.,-type`;
        const presentationWithCredential = await endpoints.createVp({
          presentation: require('./input/presentation-vc-ok.json')
        });
        if('id' in presentationWithCredential) {
          presentationWithCredential.id.should.be.a('string',
            'VP `id` value MUST be a string.');
          (new URL(presentationWithCredential.id)).should.not.throw(
            'VP `id` value MUST be a URL.');
        } else {
          this.skip();
        }
      });

      it('The type property MUST be present. One value of this property MUST ' +
        'be VerifiablePresentation, but additional types MAY be included.' +
        'The related normative guidance in Section 4.4 Types MUST be followed.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=The%20type%20property%20MUST%20be%20present.%20It%20is%20used%20to%20express%20the%20type%20of%20verifiable%20presentation.%20One%20value%20of%20this%20property%20MUST%20be%20VerifiablePresentation%2C%20but%20additional%20types%20MAY%20be%20included.%20The%20related%20normative%20guidance%20in%20Section%204.4%20Types%20MUST%20be%20followed.`;
        const presentationWithCredential = await endpoints.createVp({
          presentation: require('./input/presentation-vc-ok.json')
        });
        // TODO: given this is what we just sent in to the service...this is not
        // much of a test.
        presentationWithCredential.should.have.property('type').that.contains(
          'VerifiablePresentation',
          'VP MUST include the `VerifiablePresentation` type value.'
        );
      });

      it('The verifiableCredential property MAY be present. The value MUST ' +
        'be one or more verifiable credential and/or enveloped verifiable ' +
        'credential objects (to be clear, the values MUST NOT be non-object ' +
        'values such as numbers, strings, or URLs).', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=The%20verifiableCredential%20property%20MAY%20be%20present.%20The%20value%20MUST%20be%20one%20or%20more%20verifiable%20credential%20and/or%20enveloped%20verifiable%20credential%20objects%20(to%20be%20clear%2C%20the%20values%20MUST%20NOT%20be%20non%2Dobject%20values%20such%20as%20numbers%2C%20strings%2C%20or%20URLs).`;
        // TODO: Test with remote presentation creation or querying if/when
        // supported by the implementation
        const presentationWithCredentials = await endpoints.createVp({
          presentation: require('./input/presentation-multiple-vc-ok.json')
        });
        await assert.doesNotReject(endpoints.verifyVp(
          presentationWithCredentials
        ), 'Failed to verify a valid VP.');
        await assert.rejects(endpoints.verifyVp(require(
          './input/presentation-vc-missing-required-type-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VP containing a VC with no `type` value.');
        await assert.rejects(endpoints.verifyVp(require(
          './input/presentation-vc-as-string-fail.json')),
        'Failed to reject a VP containing a VC represented as a string.');
      });
    });
  }
});

// 4.12.1 Enveloped Verifiable Credentials https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials
describe('VP - Enveloped Verifiable Credentials', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
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
        this.skip();
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable credential using an enveloping ' +
        'security scheme, such as Securing Verifiable Credentials using JOSE ' +
        'and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20credential%20using%20an%20enveloping%20security%20scheme%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;
        // TODO: implement test
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });

      it('The type value of the object MUST be EnvelopedVerifiableCredential.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiableCredential.`;
          // TODO: implement test
          this.test.cell.skipMessage = 'TBD';
          this.skip();
        });
    });
  }
});

// 4.12.2 Enveloped Verifiable Presentations https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations
describe('VP - Enveloped Verifiable Presentations', function() {
  setupMatrix.call(this, match);
  for(const [name] of match) {

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('The @context property of the object MUST be present and include a ' +
        'context, such as the base context for this specification, that ' +
        'defines at least the id, type, and EnvelopedVerifiablePresentation ' +
        'terms as defined by the base context provided by this specification.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20%40context%20property%20of%20the%20object%20MUST%20be%20present%20and%20include%20a%20context%2C%20such%20as%20the%20base%20context%20for%20this%20specification%2C%20that%20defines%20at%20least%20the%20id%2C%20type%2C%20and%20EnvelopedVerifiablePresentation%20terms%20as%20defined%20by%20the%20base%20context%20provided%20by%20this%20specification.`;
        // TODO: implement test
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable presentation using an enveloping ' +
        'securing mechanism, such as Securing Verifiable Credentials using ' +
        'JOSE and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20presentation%20using%20an%20enveloping%20securing%20mechanism%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;
        // TODO: implement test
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });

      it('The type value of the object MUST be ' +
        'EnvelopedVerifiablePresentation.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiablePresentation.`;
        // TODO: implement test
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });
    });
  }
});

// 4.12.4 Presentations Including Holder Claims https://w3c.github.io/vc-data-model/#presentations-including-holder-claims
describe('VP - Presentations Including Holder Claims', function() {
  setupMatrix.call(this, match);
  for(const [name] of match) {

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('A verifiable presentation that includes a self-asserted verifiable ' +
        'credential that is only secured using the same mechanism as the ' +
        'verifiable presentation MUST include a holder property.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#presentations-including-holder-claims:~:text=A%20verifiable%20presentation%20that%20includes%20a%20self%2Dasserted%20verifiable%20credential%20that%20is%20only%20secured%20using%20the%20same%20mechanism%20as%20the%20verifiable%20presentation%20MUST%20include%20a%20holder%20property.`;
        // TODO: implement test
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });

      it('When a self-asserted verifiable credential is secured using the ' +
        'same mechanism as the verifiable presentation, the value of the ' +
        'issuer property of the verifiable credential MUST be identical to ' +
        'the holder property of the verifiable presentation.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#presentations-including-holder-claims:~:text=When%20a%20self%2Dasserted%20verifiable%20credential%20is%20secured%20using%20the%20same%20mechanism%20as%20the%20verifiable%20presentation%2C%20the%20value%20of%20the%20issuer%20property%20of%20the%20verifiable%20credential%20MUST%20be%20identical%20to%20the%20holder%20property%20of%20the%20verifiable%20presentation.`;
        // TODO: implement test
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });
    });
  }
});
