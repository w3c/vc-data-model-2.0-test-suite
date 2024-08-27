/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, extractIfEnveloped, setupMatrix, spaces}
  from '../tests/helpers.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {TestEndpoints} from './TestEndpoints.js';

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const require = createRequire(import.meta.url);
const baseContextUrl = 'https://www.w3.org/ns/credentials/v2';

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});

// 4.2 Verifiable Credentials https://w3c.github.io/vc-data-model/#verifiable-credentials
// There are no actual MUSTs here, just references to other sections.

// 4.3 Contexts https://w3c.github.io/vc-data-model/#contexts
describe('4.03 Contexts', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('Verifiable credentials MUST include a @context property.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20include%20a%20%40context%20property.`;
        // positive @context test
        let vc = await endpoints.issue(require(
          './input/credential-ok.json'));
        vc = extractIfEnveloped(vc);
        vc.should.have.property('@context').to.be.an('array',
          'Failed to respond with a VC with intact `@context`.');
        // negative @context test
        await assert.rejects(endpoints.issue(
          require('./input/credential-no-context-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC without an `@context`.');
      });
      it('Verifiable presentations MUST include a @context property.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20include%20a%20%40context%20property.`;
        let vp = await endpoints.createVp({
          presentation: require('./input/presentation-ok.json')
        });
        vp = extractIfEnveloped(vp);
        vp.should.have.property('@context').to.be.an('array',
          'Failed to respond with a VP with intact `@context`.');
        await assert.rejects(endpoints.verifyVp(
          require('./input/presentation-no-context-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VP without an `@context`.');
      });
      it('Application developers MUST understand every JSON-LD  \
        context used by their application.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://www.w3.org/TR/vc-data-model-2.0/#contexts:~:text=Application%20developers%20MUST%20understand%20every%20JSON%2DLD%20context%20used%20by%20their%20application`;
        this.test.cell.skipMessage = 'Untestable through automation.';
        this.skip();
      });
      it('Verifiable credentials: The value of the @context property \
        MUST be an ordered set where the first item is a URL with the value \
        https://www.w3.org/ns/credentials/v2.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20%40context%20property%20MUST%20be%20an%20ordered%20set%20where%20the%20first%20item%20is%20a%20URL%20with%20the%20value%20https%3A//www.w3.org/ns/credentials/v2.`;
        //positive issue test
        let vc = await endpoints.issue(
          require('./input/credential-ok.json'));
        vc = extractIfEnveloped(vc);
        assert(Array.isArray(vc['@context']),
          'Failed to support `@context` as an Array.');
        assert.strictEqual(vc['@context'][0], baseContextUrl,
          'Failed to keep `@context` order intact.'
        );
        // negative issue test
        await assert.rejects(endpoints.issue(
          require('./input/credential-missing-base-context-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC that lacked the VC base context URL.');
      });
      it('Verifiable presentations: The value of the @context \
        property MUST be an ordered set where the first item is a URL with \
        the value https://www.w3.org/ns/credentials/v2.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20%40context%20property%20MUST%20be%20an%20ordered%20set%20where%20the%20first%20item%20is%20a%20URL%20with%20the%20value%20https%3A//www.w3.org/ns/credentials/v2.`;
        let vp = await endpoints.createVp({
          presentation: require('./input/presentation-ok.json')
        });
        vp = extractIfEnveloped(vp);
        assert(Array.isArray(vp['@context']),
          'Failed to support `@context` as an Array.');
        assert.strictEqual(vp['@context'][0], baseContextUrl,
          'Failed to keep `@context` order intact.');
        await assert.rejects(endpoints.verifyVp(
          require(
            './input/presentation-missing-base-context-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VP that lacked the VC base context URL.');
      });
      it('Verifiable Credential `@context`: "Subsequent items in the \
        ordered set MUST be composed of any combination of URLs and/or \
        objects where each is processable as a JSON-LD Context.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Subsequent%20items%20in%20the%20ordered%20set%20MUST%20be%20composed%20of%20any%20combination%20of%20URLs%20and/or%20objects%2C%20where%20each%20is%20processable%20as%20a%20JSON%2DLD%20Context.`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-context-combo1-ok.json')),
        'Failed to support multiple `@context` URLs.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-context-combo2-ok.json')),
        'Failed to support objects in the `@context` Array.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-context-combo3-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with an invalid `@context` URL.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-context-combo4-fail.json')),
        {name: 'HTTPError'},
        'Failed to reject a VC with an unsupported `@context` value type ' +
        '(number).');
      });
      it('Verifiable Presentation "@context" "Subsequent items in the \
        ordered set MUST be composed of any combination of URLs and/or \
        objects where each is processable as a JSON-LD Context.'
        .replace(spaces, ' '), async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Subsequent%20items%20in%20the%20ordered%20set%20MUST%20be%20composed%20of%20any%20combination%20of%20URLs%20and/or%20objects%2C%20where%20each%20is%20processable%20as%20a%20JSON%2DLD%20Context.`;
        await assert.doesNotReject(
          endpoints.verifyVp(await endpoints.createVp({
            presentation:
              require('./input/presentation-context-combo1-ok.json')
          })),
          'Failed to support multiple `@context` URLs in a VP.');
        await assert.doesNotReject(
          endpoints.verifyVp(await endpoints.createVp({
            presentation:
              require('./input/presentation-context-combo2-ok.json')
          })),
          'Failed to support objects in the `@context` Array in a VP.');
        // first create a valid VP
        const vp = await endpoints.createVp({
          presentation: require('./input/presentation-vc-ok.json')
        });
        // then inject incorrect `@context` values and test verification
        vp['@context'][1] = 'https ://not-a-url/contexts/example/v1';
        await assert.rejects(endpoints.verifyVp(vp),
          'Failed to reject a VP with an invalid `@context` URL.');
        vp['@context'][1] = 123192875;
        await assert.rejects(endpoints.verifyVp(vp),
          'Failed to reject a VP with an unsupported `@context` value type ' +
          '(number).');
      });
    });
  }
});
