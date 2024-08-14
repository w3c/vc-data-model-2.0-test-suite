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

// 5. Advanced Concepts https://w3c.github.io/vc-data-model/#advanced-concepts
describe('Advanced Concepts', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      // 5.2 Extensibility https://w3c.github.io/vc-data-model/#extensibility
      // 5.2.1 Semantic Interoperability https://w3c.github.io/vc-data-model/#semantic-interoperability
      // TODO: allow implementations to opt-in as "JSON-LD-based"?
      it('JSON-LD-based processors MUST produce an error when a ' +
        'JSON-LD context redefines any term in the active context.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=When%20processing%20the%20active%20context%20defined%20by%20the%20base%20JSON%2DLD%20Context%20document%20defined%20in%20this%20specification%2C%20compliant%20JSON%2DLD%2Dbased%20processors%20produce%20an%20error%20when%20a%20JSON%2DLD%20context%20redefines%20any%20term.`;
        // This depends on "@protected" (which is used for the base context).
        // FIXME: the fixture below would also fail for missing
        // `credentialSchema.type`
        await assert.rejects(endpoints.issue(require(
          './input/credential-redef-type-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC which redefines the `VerifiableCredential` ' +
        'type.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-redef-type2-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC containing a redefiled protected term.');
      });

      // 5.3 Integrity of Related Resources https://w3c.github.io/vc-data-model/#integrity-of-related-resources
      // TODO: describe and implement tests

      // 5.4 Refreshing https://w3c.github.io/vc-data-model/#integrity-of-related-resources
      it('The value of the refreshService property MUST be one or more ' +
        'refresh services that provides enough information to the ' +
        'recipient\'s software such that the recipient can refresh the ' +
        'verifiable credential.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#terms-of-use:~:text=The%20value%20of%20the%20refreshService%20property%20MUST%20be%20one%20or%20more%20refresh%20services%20that%20provides%20enough%20information%20to%20the%20recipient%27s%20software%20such%20that%20the%20recipient%20can%20refresh%20the%20verifiable%20credential.`;
        // TODO: given that these `refreshService` values are fake...they do
        // not test the "provides enough information to...refresh"
        // TODO: these can only be meaningfully tested on issued credentials
        // that provide *real* `refreshService` values (which will require
        // opt-in in test suite implementation configuration)
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-refresh-ok.json')));
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-refreshs-ok.json')));
      });
      it('Each refreshService value MUST specify its type.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#terms-of-use:~:text=Each%20refreshService%20value%20MUST%20specify%20its%20type.`;
          // TODO: like the above, this does not test the statement, only that
          // an issuer will fail on someone else's provided and broken
          // `refreshService` value
          await assert.rejects(endpoints.issue(require(
            './input/credential-refresh-no-type-fail.json')),
          {name: 'HTTPError'},
          'Failed to reject a VC with `refreshService` without a `type`.');
        });

      // 5.5 Terms of Use https://w3c.github.io/vc-data-model/#terms-of-use
      // TODO: remove these tests if Terms of Use section removed from spec
      // https://github.com/w3c/vc-data-model/pull/1498#issuecomment-2234223927
      it('The value of the termsOfUse property MUST specify one or ' +
        'more terms of use policies under which the creator issued the ' +
        'credential or presentation.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#terms-of-use:~:text=The%20value%20of%20the%20termsOfUse%20property%20MUST%20specify%20one%20or%20more%20terms%20of%20use%20policies%20under%20which%20the%20creator%20issued%20the%20credential%20or%20presentation.`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-termsofuses-ok.json')));
      });
      it('Each termsOfUse value MUST specify its type, for example, ' +
        'IssuerPolicy, and MAY specify its instance id.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#terms-of-use:~:text=Each%20termsOfUse%20value%20MUST%20specify%20its%20type%2C%20for%20example%2C%20IssuerPolicy%2C%20and%20MAY%20specify%20its%20instance%20id.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-termsofuse-no-type-fail.json')),
        {name: 'HTTPError'});
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-termsofuse-id-ok.json')));
      });

      // 5.6 Evidence https://w3c.github.io/vc-data-model/#evidence
      it('If present, the value associated with the evidence property is a ' +
        'single object or a set of one or more objects.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#evidence:~:text=If%20present%2C%20the%20value%20associated%20with%20the%20evidence%20property%20is%20a%20single%20object%20or%20a%20set%20of%20one%20or%20more%20objects.`;
        // TODO: this does not test the statement above, only that `evidence`
        // can exist on an issued credential.
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-evidences-ok.json')));
      });

      // 5.9 Reserved Extension Points https://w3c.github.io/vc-data-model/#reserved-extension-points
      // TODO: desrible and implement tests
    });
  }
});

// 7.1 Verification https://w3c.github.io/vc-data-model/#verification
// TODO: may need tests written, though only the response could be tested

// 7.2 Problem Details https://w3c.github.io/vc-data-model/#problem-details
// TODO: optionaly response format; but we could write tests for it

// 11.1 Language and Base Direction https://w3c.github.io/vc-data-model/#language-and-base-direction
// TODO: possibly already covered by Name and Description tests
