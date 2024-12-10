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
      it('When processing the active context defined by the base JSON-LD ' +
        'Context document defined in this specification, compliant ' +
        'JSON-LD-based processors produce an error when a JSON-LD context ' +
        'redefines any term.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=When%20processing%20the%20active%20context%20defined%20by%20the%20base%20JSON%2DLD%20Context%20document%20defined%20in%20this%20specification%2C%20compliant%20JSON%2DLD%2Dbased%20processors%20produce%20an%20error%20when%20a%20JSON%2DLD%20context%20redefines%20any%20term.`;
        // This depends on "@protected" (which is used for the base context).
        // FIXME: the fixture below would also fail for missing
        // `credentialSchema.type`
        await assert.rejects(endpoints.issue(require(
          './input/credential-redef-type-fail.json')),

        'Failed to reject a VC which redefines the `VerifiableCredential` ' +
        'type.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-redef-type2-fail.json')),

        'Failed to reject a VC containing a redefiled protected term.');
      });

      // 5.3 Integrity of Related Resources https://w3c.github.io/vc-data-model/#integrity-of-related-resources
      it('The value of the relatedResource property MUST be one or more ' +
        'objects of the following form:', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#integrity-of-related-resources:~:text=The%20value%20of%20the%20relatedResource%20property%20MUST%20be%20one%20or%20more%20objects%20of%20the%20following%20form%3A`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/relatedResource/relatedResource-digest-sri-ok.json'
        )), 'Failed to accept a VC with valid relatedResource objects.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/relatedResource/relatedResource-digest-multibase-ok.json'
        )), 'Failed to accept a VC with valid relatedResource objects.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/relatedResource/relatedResource-with-mediaType-ok.json'
        )),
        'Failed to accept a VC with valid relatedResource.mediaType values.');
        await assert.rejects(endpoints.issue(require(
          './input/relatedResource/relatedResource-list-of-strings-fail.json'
        )),
        'Failed to reject a VC with a relatedResource as an array of strings.');
      });
      it('The identifier for the resource is REQUIRED and conforms to the ' +
        'format defined in Section 4.4 Identifiers.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#integrity-of-related-resources:~:text=The%20identifier%20for%20the%20resource%20is%20REQUIRED%20and%20conforms%20to%20the%20format%20defined%20in%20Section%204.4%20Identifiers.%20The%20value%20MUST%20be%20unique%20among%20the%20list%20of%20related%20resource%20objects.`;
        await assert.rejects(endpoints.issue(require(
          './input/relatedResource/relatedResource-missing-id-fail.json'
        )),
        'Failed to reject a VC with a relatedResource with no `id` field.');
      });
      it('The value MUST be unique ' +
        'among the list of related resource objects.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#integrity-of-related-resources:~:text=The%20identifier%20for%20the%20resource%20is%20REQUIRED%20and%20conforms%20to%20the%20format%20defined%20in%20Section%204.4%20Identifiers.%20The%20value%20MUST%20be%20unique%20among%20the%20list%20of%20related%20resource%20objects.`;
        await assert.rejects(endpoints.issue(require(
          './input/relatedResource/relatedResource-duplicate-id-fail.json'
        )),
        'Failed to reject a VC with a relatedResource with ' +
        'a duplicate `id` field.');
      });
      it('Each object associated with relatedResource MUST contain at least ' +
        'a digestSRI or a digestMultibase value.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#integrity-of-related-resources:~:text=Each%20object%20associated%20with%20relatedResource%20MUST%20contain%20at%20least%20a%20digestSRI%20or%20a%20digestMultibase%20value.`;
        await assert.rejects(endpoints.issue(require(
          './input/relatedResource/relatedResource-no-digest-fail.json'
        )),
        'Failed to reject a VC with a relatedResource with no digest info.');
      });
      it('If the digest provided by the issuer does not match the digest ' +
        'computed for the retrieved resource, the conforming verifier ' +
        'implementation MUST produce an error.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#integrity-of-related-resources:~:text=If%20the%20digest%20provided%20by%20the%20issuer%20does%20not%20match%20the%20digest%20computed%20for%20the%20retrieved%20resource%2C%20the%20conforming%20verifier%20implementation%20MUST%20produce%20an%20error.`;
        await assert.rejects(endpoints.issue(require(
          './input/relatedResource/relatedResource-digest-sri-fail.json'
        )),
        'Failed to reject a VC with a relatedResource with wrong digest.');
        await assert.rejects(endpoints.issue(require(
          './input/relatedResource/relatedResource-digest-multibase-fail.json'
        )),
        'Failed to reject a VC with a relatedResource with wrong digest.');
      });

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
          './input/credential-termsofuse-no-type-fail.json')));
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

      // 5.10 Reserved Extension Points https://w3c.github.io/vc-data-model/#reserved-extension-points
      it('In order to avoid collisions regarding how the following ' +
        'properties are used, implementations MUST specify a type property ' +
        'in the value associated with the reserved property.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#reserved-extension-points:~:text=In%20order%20to%20avoid%20collisions%20regarding%20how%20the%20following%20properties%20are%20used%2C%20implementations%20MUST%20specify%20a%20type%20property%20in%20the%20value%20associated%20with%20the%20reserved%20property.`;
        // TODO: implement
        this.test.cell.skipMessage = 'TBD';
        this.skip();
      });
    });
  }
});
