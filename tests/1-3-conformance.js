/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix} from './helpers.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {filterByTag} from 'vc-test-suite-implementations';
import {TestEndpoints} from './TestEndpoints.js';

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});

// // 1.3 Conformance https://w3c.github.io/vc-data-model/#conformance
// // TODO: consolidate scattered MUST statements from this section that are
// // ...elsewhere in the test suite
// // TODO: add missing media type MUSTs
describe('Basic Conformance', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);
      it('Conforming document (compliance): VCDM "MUST be enforced." ' +
        '("all relevant normative statements in Sections 4. Basic Concepts, ' +
        '5. Advanced Concepts, and 6. Syntaxes")', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#identifiers:~:text=of%20this%20document-,MUST%20be%20enforced.,-A%20conforming%20document`;
        this.test.cell.skipMessage = 'Tested by other tests in this suite.';
        this.skip();
      });
      it('verifiers MUST produce errors when non-conforming documents ' +
        'are detected.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=MUST%20produce%20errors%20when%20non%2Dconforming%20documents%20are%20detected.`;
        const doc = {
          type: ['NonconformingDocument']
        };
        await assert.rejects(endpoints.verify(doc), {name: 'HTTPError'},
          'Failed to reject malformed VC.');
        await assert.rejects(endpoints.verifyVp(doc), {name: 'HTTPError'},
          'Failed to reject malformed VP.');
      });
      // TODO re-review whether all broad MUST statements in this intro section
      // are adequately covered by other tests, or if they need unique tests.
    });
  }
});
