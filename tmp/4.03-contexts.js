/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {addPerTestMetadata, setupMatrix} from '../tests/helpers.js';
import {createInvalidVp, createLocalVp} from '../tests/data-generator.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {injectOrReject} from '../tests/assertions.js';
import {klona} from 'klona';
import {TestEndpoints} from '../tests/TestEndpoints.js';

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const require = createRequire(import.meta.url);
const baseContextUrl = 'https://www.w3.org/ns/credentials/v2';

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});

// 4.2 Verifiable Credentials https://w3c.github.io/vc-data-model/#verifiable-credentials
// There are no actual MUSTs here, just references to other sections.

// 4.3 Contexts https://w3c.github.io/vc-data-model/#contexts
describe('Contexts', function() {
  setupMatrix.call(this, match);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('Verifiable credentials MUST include a @context property.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20include%20a%20%40context%20property.`;
          // positive @context test
          const vc = await endpoints.issue(require(
            '../tests/input/credential-ok.json'));
          vc.should.have.property('@context').to.be.an('array',
            'Failed to respond with a VC with intact `@context`.');
          // negative @context test
          await injectOrReject(endpoints,
            './input/credential-no-context-fail-or-inject.json');

        });
      it('Verifiable presentations MUST include a @context property.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20include%20a%20%40context%20property.`;
          const validVp = await createLocalVp({
            presentation: require('../tests/input/presentation-ok.json')
          });
          await assert.doesNotReject(
            endpoints.verifyVp(validVp),
            `verifier ${name} rejected VP with valid @context.`
          );
          const invalidVp = klona(validVp);
          delete invalidVp['@context'];
          await assert.rejects(endpoints.verifyVp(invalidVp),
            'Failed to reject a VP with a missing @context.');
        });
      it('Verifiable credentials: The value of the @context property ' +
        'MUST be an ordered set where the first item is a URL with the value ' +
        'https://www.w3.org/ns/credentials/v2.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20%40context%20property%20MUST%20be%20an%20ordered%20set%20where%20the%20first%20item%20is%20a%20URL%20with%20the%20value%20https%3A//www.w3.org/ns/credentials/v2.`;
        //positive issue test
        const vc = await endpoints.issue(require(
          '../tests/input/credential-ok.json'));
        assert(Array.isArray(vc['@context']),
          'Failed to support `@context` as an Array.');
        assert.strictEqual(vc['@context'][0], baseContextUrl,
          'Failed to keep `@context` order intact.'
        );
        // negative issue test
        await injectOrReject(endpoints,
          './input/credential-missing-base-context-fail-or-inject.json');
      });
      it('Verifiable presentations: The value of the @context ' +
        'property MUST be an ordered set where the first item is a URL with ' +
        'the value https://www.w3.org/ns/credentials/v2.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20%40context%20property%20MUST%20be%20an%20ordered%20set%20where%20the%20first%20item%20is%20a%20URL%20with%20the%20value%20https%3A//www.w3.org/ns/credentials/v2.`;
        const vpInvalidContextOrder = await createInvalidVp({
          presentation: require('../tests/input/presentation-context-order-fail.json')
        });
        await assert.rejects(endpoints.verifyVp(vpInvalidContextOrder),

          'Failed to reject a VP that has the wrong context order.');
        const vp = createLocalVp({
          presentation: require('../tests/input/presentation-ok.json')
        });
        vp['@context'] = [
          'https://www.w3.org/ns/credentials/examples/v2',
          'https://www.w3.org/ns/credentials/v2'
        ];
        await assert.rejects(endpoints.verifyVp(vp),
          'Failed to reject a VP with unordered @context.');
        await assert.rejects(endpoints.verifyVp(
          require('../tests/input/presentation-missing-base-context-fail.json')),

        'Failed to reject a VP that lacked the VC base context URL.');
      });
      it('Verifiable Credential `@context`: "Subsequent items in the ' +
        'ordered set MUST be composed of any combination of URLs and/or ' +
        'objects where each is processable as a JSON-LD Context."',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Subsequent%20items%20in%20the%20ordered%20set%20MUST%20be%20composed%20of%20any%20combination%20of%20URLs%20and/or%20objects%2C%20where%20each%20is%20processable%20as%20a%20JSON%2DLD%20Context.`;
        await assert.doesNotReject(endpoints.issue(require(
          '../tests/input/credential-context-combo1-ok.json')),
        'Failed to support multiple `@context` URLs.');
        await assert.doesNotReject(endpoints.issue(require(
          '../tests/input/credential-context-combo2-ok.json')),
        'Failed to support objects in the `@context` Array.');
        await assert.rejects(endpoints.issue(require(
          '../tests/input/credential-context-combo3-fail.json')),

        'Failed to reject a VC with an invalid `@context` URL.');
        await assert.rejects(endpoints.issue(require(
          '../tests/input/credential-context-combo4-fail.json')),

        'Failed to reject a VC with an unsupported `@context` value type ' +
        '(number).');
      });
      it('Verifiable Presentation `@context`: "Subsequent items in the ' +
        'ordered set MUST be composed of any combination of URLs and/or ' +
        'objects where each is processable as a JSON-LD Context."',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Subsequent%20items%20in%20the%20ordered%20set%20MUST%20be%20composed%20of%20any%20combination%20of%20URLs%20and/or%20objects%2C%20where%20each%20is%20processable%20as%20a%20JSON%2DLD%20Context.`;
        await assert.doesNotReject(
          endpoints.verifyVp(await createLocalVp({
            presentation:
              require('../tests/input/presentation-context-combo1-ok.json')
          })),
          'Failed to support multiple `@context` URLs in a VP.');
        await assert.doesNotReject(
          endpoints.verifyVp(await createLocalVp({
            presentation:
              require('../tests/input/presentation-context-combo2-ok.json')
          })),
          'Failed to support objects in the `@context` Array in a VP.');
        // first create a valid VP
        const vp = await createLocalVp({
          presentation: require('../tests/input/presentation-vc-ok.json')
        });
        // then inject incorrect `@context` values and test verification
        vp['@context'][1] = 'https://example.com';
        await assert.rejects(endpoints.verifyVp(vp),
          'Failed to reject a VP with an invalid `@context` URL.');
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
