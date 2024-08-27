/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix, spaces} from './helpers.js';
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

// 4.6 Names and Descriptions https://w3c.github.io/vc-data-model/#names-and-descriptions
// These tests for name and descrpition are OPTIONAL as those properties may
// appear anywhere. However, we have tests for them (on `issuer` so far), so
// keeping them in play seems prudent/useful. They can be expanded later also
// to cover `name` and/or `description` anywhere they appear.

// Also, the normative section...
// 11.1 Language and Base Direction https://w3c.github.io/vc-data-model/#language-and-base-direction
// ...is partially covered by these tests. A more complete approach would test
// any occurance of a "Value Object" (detecting `@value` throughout the tree)
// and test for conformat member properties (`@language` and `@direction`) and
// fail on the existence of any other properties.
describe('4.06 Names and Descriptions', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      const fixturePath = './input/names-and-descriptions';
      // On the main credential object itself--as the spec describes
      it('Credential: If present, the value of the name \
        property MUST be a string or a language value object as \
        described in 11.1 Language and Base Direction.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#names-and-descriptions:~:text=If%20present%2C%20the%20value%20of%20the%20name%20property%20MUST%20be%20a%20string%20or%20a%20language%20value%20object%20as%20described%20in%2011.1%20Language%20and%20Base%20Direction.`;
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-name-ok.json`)),
        'Failed to accept a VC with a `name` as a string.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-name-optional-ok.json`)),
        'Failed to accept a VC without a `name` property.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-name-language-en-ok.json`)),
        'Failed to accept a VC using `name` in a defined language.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-name-language-direction-en-ok.json`)),
        'Failed to accept a VC using `name` with language & direction ' +
        'expressed.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-multi-language-name-ok.json`)),
        'Failed to accept a VC with `name` in multiple languages.');
        await assert.rejects(endpoints.issue(require(
          `${fixturePath}/credential-name-extra-prop-en-fail.json`)),
        {name: 'HTTPError'},
        'Failed to reject a VC with `name` containing extra properties.');
      });
      it('Credential: If present, the value of the description \
        property MUST be a string or a language value object as \
        described in 11.1 Language and Base Direction.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#names-and-descriptions:~:text=If%20present%2C%20the%20value%20of%20the%20description%20property%20MUST%20be%20a%20string%20or%20a%20language%20value%20object%20as%20described%20in%2011.1%20Language%20and%20Base%20Direction.`;
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-description-ok.json`)),
        'Failed to accept a VC with `description` as a string.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-description-optional-ok.json`)),
        'Failed to accept a VC with `description` missing.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-description-language-en-ok.json`)),
        'Failed to accept a VC using `description` in a defined language.');
        await assert.doesNotReject(endpoints.issue(require(
          // eslint-disable-next-line max-len
          `${fixturePath}/credential-description-language-direction-en-ok.json`)),
        'Failed to accept a VC using `description` with language & direction ' +
        'expressed.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/credential-multi-language-description-ok.json`)),
        'Failed to accept a VC with `description` in multiple languages.');
        await assert.rejects(endpoints.issue(require(
          `${fixturePath}/credential-description-extra-prop-en-fail.json`)),
        {name: 'HTTPError'},
        'Failed to reject a VC with `description` containing extra ' +
        'properties.');
      });

      // On `issuer` as in the example at https://w3c.github.io/vc-data-model/#example-usage-of-the-name-and-description-property-0
      it('Issuer: If present, the value of the name \
        property MUST be a string or a language value object as \
        described in 11.1 Language and Base Direction.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#names-and-descriptions:~:text=If%20present%2C%20the%20value%20of%20the%20name%20property%20MUST%20be%20a%20string%20or%20a%20language%20value%20object%20as%20described%20in%2011.1%20Language%20and%20Base%20Direction.`;
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-name-ok.json`)),
        'Failed to accept a VC with `issuer.name` as a string.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-name-optional-ok.json`)),
        'Failed to accept a VC without `issuer.name`.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-name-language-en-ok.json`)),
        'Failed to accept a VC using `issuer.name` in a defined language.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-name-language-direction-en-ok.json`)),
        'Failed to accept a VC using `issuer.name` with language & direction ' +
        'expressed.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-multi-language-name-ok.json`)),
        'Failed to accept a VC with `issuer.name` in multiple languages.');
        await assert.rejects(endpoints.issue(require(
          `${fixturePath}/issuer-name-extra-prop-en-fail.json`)),
        {name: 'HTTPError'},
        'Failed to reject a VC with `issuer.name` containing extra ' +
        'properties.');
      });
      it('Issuer: If present, the value of the \
        description property MUST be a string or a language \
        value object as described in 11.1 Language and Base Direction.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#names-and-descriptions:~:text=If%20present%2C%20the%20value%20of%20the%20description%20property%20MUST%20be%20a%20string%20or%20a%20language%20value%20object%20as%20described%20in%2011.1%20Language%20and%20Base%20Direction.`;
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-description-ok.json`)),
        'Failed to accept a VC with `issuer.description` as a string.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-description-optional-ok.json`)),
        'Failed to accept a VC without `issuer.description`.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-description-language-en-ok.json`)),
        'Failed to accept a VC using `issuer.description` in a defined ' +
        'language.');
        await assert.doesNotReject(endpoints.issue(require(
          // eslint-disable-next-line max-len
          `${fixturePath}/issuer-description-language-direction-en-ok.json`)),
        'Failed to accept a VC using `issuer.description` with language & ' +
        'direction expressed.');
        await assert.doesNotReject(endpoints.issue(require(
          `${fixturePath}/issuer-multi-language-description-ok.json`)),
        'Failed to accept a VC with `issuer.description` in multiple ' +
        'languages.');
        await assert.rejects(endpoints.issue(require(
          `${fixturePath}/issuer-description-extra-prop-en-fail.json`)),
        {name: 'HTTPError'},
        'Failed to reject a VC with `issuer.description` containing extra ' +
        'properties.');
      });
    });
  }
});
