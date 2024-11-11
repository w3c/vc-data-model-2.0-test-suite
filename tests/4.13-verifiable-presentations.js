/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix}
  from './helpers.js';
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

// 4.13 Verifiable Presentations https://w3c.github.io/vc-data-model/#verifiable-presentations
describe('Verifiable Presentations', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If [the `id` field is] present, the normative guidance in Section ' +
        '4.4 Identifiers MUST be followed.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=verifiable%20presentation.-,If%20present%2C%20the%20normative%20guidance%20in%20Section%204.4%20Identifiers%20MUST%20be%20followed.,-type`;
        const presentationValidId = await createLocalVp({
          presentation: require('./input/presentation-id-ok.json')
        });
        await assert.doesNotReject(
          endpoints.verifyVp(presentationValidId),
          `Expected verifier ${name} to verify a VP with a valid id.`
        );
      });

      it('The type property MUST be present.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=The%20type%20property%20MUST%20be%20present.%20It%20is%20used%20to%20express%20the%20type%20of%20verifiable%20presentation.%20One%20value%20of%20this%20property%20MUST%20be%20VerifiablePresentation%2C%20but%20additional%20types%20MAY%20be%20included.%20The%20related%20normative%20guidance%20in%20Section%204.5%20Types%20MUST%20be%20followed.`;
          const presentationWithType = await createLocalVp({
            presentation: require('./input/presentation-ok.json')
          });
          await assert.doesNotReject(
            endpoints.verifyVp(presentationWithType),
            `Expected verifier ${name} to verify a VP with initial ` +
          `type VerifiablePresentation.`);
          // TODO, how to create negative fixture (missing type)
        });

      it('One value of this property MUST ' +
        'be VerifiablePresentation, but additional types MAY be included.' +
        'The related normative guidance in Section 4.5 Types MUST be followed.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=The%20type%20property%20MUST%20be%20present.%20It%20is%20used%20to%20express%20the%20type%20of%20verifiable%20presentation.%20One%20value%20of%20this%20property%20MUST%20be%20VerifiablePresentation%2C%20but%20additional%20types%20MAY%20be%20included.%20The%20related%20normative%20guidance%20in%20Section%204.5%20Types%20MUST%20be%20followed.`;
        const presentationWithType = await createLocalVp({
          presentation: require('./input/presentation-ok.json')
        });
        await assert.doesNotReject(
          endpoints.verifyVp(presentationWithType),
          `Expected verifier ${name} to verify a VP with initial ` +
          `type VerifiablePresentation.`
        );
        // TODO, how to create negative fixture (wrong type)
      });

      it('The verifiableCredential property MAY be present. The value MUST be' +
        'one or more verifiable credential and/or enveloped verifiable ' +
        'credential objects (the values MUST NOT be non-object values such ' +
        'as numbers, strings, or URLs).', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=The%20verifiableCredential%20property%20MAY%20be%20present.%20The%20value%20MUST%20be%20one%20or%20more%20verifiable%20credential%20and/or%20enveloped%20verifiable%20credential%20objects%20(the%20values%20MUST%20NOT%20be%20non%2Dobject%20values%20such%20as%20numbers%2C%20strings%2C%20or%20URLs).`;
        // TODO: Test with remote presentation creation or querying if/when
        // supported by the implementation
        const presentationWithCredentials = await createLocalVp({
          presentation: require('./input/presentation-multiple-vc-ok.json')
        });
        await assert.doesNotReject(endpoints.verifyVp(
          presentationWithCredentials
        ), 'Failed to verify a valid VP.');
        // TODO, how to create negative fixture (bad vc values)
      });

      it('If present (holder), the value MUST be either a URL or ' +
        'an object containing an id property.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-presentations:~:text=The%20verifiableCredential%20property%20MAY%20be%20present.%20The%20value%20MUST%20be%20one%20or%20more%20verifiable%20credential%20and/or%20enveloped%20verifiable%20credential%20objects%20(the%20values%20MUST%20NOT%20be%20non%2Dobject%20values%20such%20as%20numbers%2C%20strings%2C%20or%20URLs).`;
        // TODO: Test with remote presentation creation or querying if/when
        // supported by the implementation
        const presentationWithHolder = await createLocalVp({
          presentation: require('./input/presentation-holder-ok.json')
        });
        await assert.doesNotReject(endpoints.verifyVp(
          presentationWithHolder
        ), 'Failed to verify a valid VP with holder.');

        const presentationWithHolderObject = await createLocalVp({
          presentation: require('./input/presentation-holder-object-ok.json')
        });
        await assert.doesNotReject(endpoints.verifyVp(
          presentationWithHolderObject
        ), 'Failed to verify a valid VP with holder object.');
        // TODO, how to create negative fixture (bad holder values)
      });
    });
  }
});

// 4.12.4 Presentations Including Holder Claims https://w3c.github.io/vc-data-model/#presentations-including-holder-claims
describe('VP - Presentations Including Holder Claims', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('A verifiable presentation that includes a self-asserted verifiable ' +
        'credential that is only secured using the same mechanism as the ' +
        'verifiable presentation MUST include a holder property.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#presentations-including-holder-claims:~:text=A%20verifiable%20presentation%20that%20includes%20a%20self%2Dasserted%20verifiable%20credential%20that%20is%20only%20secured%20using%20the%20same%20mechanism%20as%20the%20verifiable%20presentation%20MUST%20include%20a%20holder%20property.`;
        const selfAssertedNoHolder = await createLocalVp({
          presentation: require(
            './input/presentation-self-asserted-vc-no-holder.json')
        });
        await assert.rejects(endpoints.verifyVp(
          selfAssertedNoHolder
        ), 'Failed to reject a VP with self-asserted VC without holder.');
      });

      it('When a self-asserted verifiable credential is secured using the ' +
        'same mechanism as the verifiable presentation, the value of the ' +
        'issuer property of the verifiable credential MUST be identical to ' +
        'the holder property of the verifiable presentation.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#presentations-including-holder-claims:~:text=When%20a%20self%2Dasserted%20verifiable%20credential%20is%20secured%20using%20the%20same%20mechanism%20as%20the%20verifiable%20presentation%2C%20the%20value%20of%20the%20issuer%20property%20of%20the%20verifiable%20credential%20MUST%20be%20identical%20to%20the%20holder%20property%20of%20the%20verifiable%20presentation.`;
        const presentationHolderMatch = await createLocalVp({
          presentation: require(
            './input/presentation-self-asserted-vc-ok.json')
        });
        await assert.doesNotReject(endpoints.verifyVp(
          presentationHolderMatch
        ), 'Failed to verify a VP containing a self-asserted VC.');

        const presentationHolderMismatch = await createLocalVp({
          presentation: require(
            './input/presentation-self-asserted-vc-holder-mismatch.json')
        });
        await assert.rejects(endpoints.verifyVp(
          presentationHolderMismatch
        ), 'Failed to reject a VP with self-asserted VC ' +
        'with a holder/issuer mismatch.');

        const presentationIssuerMismatch = await createLocalVp({
          presentation: require(
            './input/presentation-self-asserted-vc-issuer-mismatch.json')
        });
        await assert.rejects(endpoints.verifyVp(
          presentationIssuerMismatch
        ), 'Failed to reject a VP with self-asserted VC ' +
        'with a holder/issuer mismatch.');
      });
    });
  }
});
