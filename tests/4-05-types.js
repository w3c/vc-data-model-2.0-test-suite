/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix, trimText} from './helpers.js';
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

// 4.5 Types https://w3c.github.io/vc-data-model/#types
describe('Types', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it(trimText(`Verifiable credentials MUST contain a type property with an
        'associated value.`), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20contain%20a%20type%20property%20with%20an%20associated%20value.`;
        await assert.rejects(
          endpoints.issue(require('./input/credential-no-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a VC without a type.');
      });
      it(trimText(`Verifiable presentations MUST contain a type property with an
        'associated value.`), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20contain%20a%20type%20property%20with%20an%20associated%20value.`;
        await assert.rejects(endpoints.verifyVp(require(
          './input/presentation-no-type-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VP without a type.');
      });
      it(trimText(`The value of the type property MUST be one or more terms 
        and/or absolute URL strings.`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20type%20property%20MUST%20be%20one%20or%20more%20terms%20and/or%20absolute%20URL%20strings.`;
        // type is URL: OK
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-type-url-ok.json')),
        'Failed to accept a VC with an additional type as a URL.');
        // type mapping to URL: OK
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-type-mapped-url-ok.json')),
        trimText(`Failed to accept a VC with an additional type 
          defined in the "@context".`));
        // type mapped not to URL: fail
        await assert.rejects(endpoints.issue(require(
          './input/credential-type-mapped-nonurl-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with type mapped to an invalid URL.');
        // type not mapped: fail
        await assert.rejects(endpoints.issue(require(
          './input/credential-type-unmapped-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with an unmapped (via `@context`) type.');
      });
      it(trimText(`If more than one (type) value is provided, the order does not
        'matter.`), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=If%20more%20than%20one%20value%20is%20provided%2C%20the%20order%20does%20not%20matter.`;
        //issue VC with multiple urls in type property
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-type-urls-order-1-ok.json')),
        trimText(`Failed to accept a VC with different type 
          array ordering (VC type last).`));
        //issue another VC with same urls in a different order
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-type-urls-order-2-ok.json')),
        trimText(`Failed to accept a VC with different type 
          array ordering (VC type middle).`));
      });
      // Verifiable Credential MUST have a type specified
      it(trimText(`Verifiable Credential objects MUST have a type 
        specified including "VerifiableCredential".`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-optional-type-ok.json')),
        'Failed to accept a VC with additional type.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-missing-required-type-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC missing the `VerifiableCredential` type.');
      }
      );
      // Verifiable Presentation MUST have a type specified
      it(trimText(`Verifiable Presentation objects MUST have a 
        type specified including "VerifiablePresentation".`),
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
        const presentationOptionalType = await endpoints.createVp({
          presentation: require('./input/presentation-optional-type-ok.json')
        });
        await assert.doesNotReject(endpoints.verifyVp(
          presentationOptionalType
        ), 'Failed to accept VP with `@context` mapped type.');
        await assert.rejects(
          endpoints.verifyVp(require(
            './input/presentation-missing-required-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject VP missing `VerifiableCredential` type.');
      }
      );
      // credentialStatus MUST have a type specified.
      it(trimText(`"credentialStatus" objects MUST have a type specified.`),
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-status-ok.json')),
          'Failed to accept a VC with `credentialStatus` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-status-missing-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a VC with `credentialStatus` without a `type`.');
        }
      );
      // termsOfUse MUST have a type specified.
      it(trimText(`"termsOfUse" objects MUST have a type specified.`),
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(require(
            './input/credential-termsofuse-ok.json')),
          'Failed to accept a VC with `termsOfUse` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-termsofuse-missing-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a VC with `termsOfUse` without a `type`.');
        }
      );
      // evidence MUST have a type specified.
      it(trimText(`"evidence" objects MUST have a type specified.`),
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-evidence-ok.json')),
          'Failed to accept a VC with `evidence` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-evidence-missing-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a VC with `evidence` without a `type`.');
        }
      );
      it(trimText(`"refreshService" objects MUST have a type specified.`),
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-refresh-type-ok.json')),
          'Failed to accept a VC with `refreshService` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-refresh-no-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a VC with `refreshService` without a `type`.');
        }
      );
      it(trimText(`"credentialSchema" objects MUST have a type specified.`),
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-schema-type-ok.json')),
          'Failed to accept a VC with `credentialSchema` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-schema-no-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject `credentialSchema` without a `type`.');
        }
      );
    });
  }
});
