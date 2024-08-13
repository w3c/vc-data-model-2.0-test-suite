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

// 4.10 Status https://w3c.github.io/vc-data-model/#status
describe('Status', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If present (credentialStatus.id), the normative guidance ' +
        'in Section 4.4 Identifiers MUST be followed.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#status:~:text=credential%20status%20object.-,If%20present%2C%20the%20normative%20guidance%20in%20Section%204.4%20Identifiers%20MUST%20be%20followed.,-type`;
        // id is optional
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-status-missing-id-ok.json')),
        'Failed to accept a VC with `credentialStatus` without an `id`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-multiple-id-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with multiple `credentialStatus.id` values.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-nonurl-id-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with a non-URL `credentialStatus.id`.');
      });
      it('(If a credentialStatus property is present), The type ' +
        'property is REQUIRED. It is used to express the type of status ' +
        'information expressed by the object. The related normative ' +
        'guidance in Section 4.5 Types MUST be followed.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#status:~:text=The%20type%20property%20is%20REQUIRED.%20It%20is%20used%20to%20express%20the%20type%20of%20status%20information%20expressed%20by%20the%20object.%20The%20related%20normative%20guidance%20in%20Section%204.5%20Types%20MUST%20be%20followed.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-missing-type-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC missing `credentialStatus.type`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-type-nonurl-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with a non-URL `credentialStatus.type`.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-status-ok.json')),
        'Failed to accept a VC with a valid `credentialStatus`.');
      });
      it('Credential status specifications MUST NOT enable tracking of ' +
        'individuals', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#status:~:text=Credential%20status%20specifications%20MUST%20NOT%20enable%20tracking%20of%20individuals`;
        this.test.cell.skipMessage = 'Not testable with automation.';
        this.skip();
      });
    });
  }
});
