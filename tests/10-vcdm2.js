/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {challenge, createTimeStamp} from './data-generator.js';
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {filterByTag} from 'vc-test-suite-implementations';
import {shouldRejectEitherIssueOrVerify} from './assertions.js';
import {TestEndpoints} from './TestEndpoints.js';

const should = chai.should();

const require = createRequire(import.meta.url);
const baseContextUrl = 'https://www.w3.org/ns/credentials/v2';

const tag = 'vc2.0';
const {match} = filterByTag({tags: [tag]});
const oneYear = 1;

function setupMatrix() {
  // this will tell the report
  // to make an interop matrix with this suite
  this.matrix = true;
  this.report = true;
  this.implemented = [...match.keys()];
  this.rowLabel = 'Test Name';
  this.columnLabel = 'Implementer';
}

function addPerTestMetadata() {
  // append test meta data to the it/test this.
  this.currentTest.cell = {
    columnId: this.currentTest.parent.title,
    rowId: this.currentTest.title
  };
}

// // 1.3 Conformance https://w3c.github.io/vc-data-model/#conformance
// // TODO: consolidate scattered MUST statements from this section that are
// // ...elsewhere in the test suite
// // TODO: add missing media type MUSTs
describe('Basic Conformance', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);
      it.skip('Conforming document (compliance): VCDM "MUST be enforced." ' +
        '("all relevant normative statements in Sections 4. Basic Concepts, ' +
        '5. Advanced Concepts, and 6. Syntaxes")', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#identifiers:~:text=of%20this%20document-,MUST%20be%20enforced.,-A%20conforming%20document`;
        // not specifically testable; handled by other section tests.
      });
      it('verifiers MUST produce errors when non-conforming documents ' +
        'are detected.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=MUST%20produce%20errors%20when%20non%2Dconforming%20documents%20are%20detected.`;
        const doc = {
          type: ['NonconformingDocument']
        };
        await assert.rejects(endpoints.verify(doc),
          'Failed to reject malformed VC.');
        await assert.rejects(endpoints.verifyVp(doc),
          'Failed to reject malformed VP.');
      });
      // TODO re-review whether all broad MUST statements in this intro section
      // are adequately covered by other tests, or if they need unique tests.
    });
  }
});

// 4.2 Contexts https://w3c.github.io/vc-data-model/#contexts
describe('Contexts', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});
    const createOptions = {challenge};

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('Verifiable credentials MUST include a @context property.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20include%20a%20%40context%20property.`;
          // positive @context test
          const vc = await endpoints.issue(require(
            './input/credential-ok.json'));
          vc.should.have.property('@context').to.be.an('array',
            'Failed to respond with a VC with intact `@context`.');
          // negative @context test
          await assert.rejects(endpoints.issue(
            require('./input/credential-no-context-fail.json')),
          'Failed to reject a VC without an `@context`.');
        });
      it('Verifiable presentations MUST include a @context property.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20include%20a%20%40context%20property.`;
          const vp = await endpoints.createVp({
            presentation: require('./input/presentation-ok.json'),
            options: createOptions
          });
          vp.should.have.property('@context').to.be.an('array',
            'Failed to respond with a VP with intact `@context`.');
          await assert.rejects(endpoints.verifyVp(
            require('./input/presentation-no-context-fail.json')),
          'Failed to reject a VP without an `@context`.');
        });
      it('Verifiable credentials: The value of the @context property ' +
        'MUST be an ordered set where the first item is a URL with the value ' +
        'https://www.w3.org/ns/credentials/v2.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20%40context%20property%20MUST%20be%20an%20ordered%20set%20where%20the%20first%20item%20is%20a%20URL%20with%20the%20value%20https%3A//www.w3.org/ns/credentials/v2.`;
        //positive issue test
        const vc = await endpoints.issue(require('./input/credential-ok.json'));
        assert(Array.isArray(vc['@context']),
          'Failed to support `@context` as an Array.');
        assert.strictEqual(vc['@context'][0], baseContextUrl,
          'Failed to keep `@context` order intact.'
        );
        // negative issue test
        await assert.rejects(endpoints.issue(
          require('./input/credential-missing-base-context-fail.json')),
        'Failed to reject a VC that lacked the VC base context URL.');
      });
      it('Verifiable presentations: The value of the @context ' +
        'property MUST be an ordered set where the first item is a URL with ' +
        'the value https://www.w3.org/ns/credentials/v2.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20%40context%20property%20MUST%20be%20an%20ordered%20set%20where%20the%20first%20item%20is%20a%20URL%20with%20the%20value%20https%3A//www.w3.org/ns/credentials/v2.`;
        const vp = await endpoints.createVp({
          presentation: require('./input/presentation-ok.json'),
          options: createOptions
        });
        assert(Array.isArray(vp['@context']),
          'Failed to support `@context` as an Array.');
        assert.strictEqual(vp['@context'][0], baseContextUrl,
          'Failed to keep `@context` order intact.');
        await assert.rejects(endpoints.verifyVp(
          require('./input/presentation-missing-base-context-fail.json')),
        'Failed to reject a VP that lacked the VC base context URL.');
      });
      // TODO: Missing VP variation
      it('Verifiable credential @context: "Subsequent items in the ' +
        'ordered set MUST be composed of any combination of URLs and/or ' +
        'objects where each is processable as a JSON-LD Context."',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Subsequent%20items%20in%20the%20ordered%20set%20MUST%20be%20composed%20of%20any%20combination%20of%20URLs%20and/or%20objects%2C%20where%20each%20is%20processable%20as%20a%20JSON%2DLD%20Context.`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-context-combo1-ok.json'),
        'Failed to support multiple `@context` URLs.'));
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-context-combo2-ok.json'),
        'Failed to support objects in the `@context` Array.'));
        await assert.rejects(endpoints.issue(require(
          './input/credential-context-combo3-fail.json')),
        'Failed to reject a VC with an invalid `@context` URL.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-context-combo4-fail.json')),
        'Failed to reject a VC with an unsupported `@context` value type ' +
        '(number).');
      });
    });
  }
});

// 4.3 Identifiers https://w3c.github.io/vc-data-model/#identifiers
describe('Identifiers', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If present, the value of the id property MUST be a single URL, ' +
        'which MAY be dereferenceable.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=If%20present%2C%20the%20value%20of%20the%20id%20property%20MUST%20be%20a%20single%20URL%2C%20which%20MAY%20be%20dereferenceable.`;
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-id-other-ok.json')),
        'Failed to accept a VC with a DID credentialSubject identifier.');
        await assert.rejects(
          endpoints.issue(require(
            './input/credential-id-nonidentifier-fail.json')),
          'Failed to reject a credential with a `null` identifier.');

        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-id-single-ok.json')),
        'Failed to accept a VC with a valid identifier.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-id-subject-single-ok.json')),
        'Failed to accept a VC with a valid credentialSubject identifier');
        await assert.rejects(endpoints.issue(require(
          './input/credential-id-multi-fail.json')),
        'Failed to reject a VC with multiple `id` values.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-id-subject-multi-fail.json')),
        'Failed to reject a VC with multiple credentialSubject identifiers.');

        await assert.rejects(
          endpoints.issue(require('./input/credential-id-not-url-fail.json')),
          'Failed to reject a credential with an invalid identifier.');
      });
    });
  }
});

// 4.4 Types https://w3c.github.io/vc-data-model/#types
describe('Types', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});
    const createOptions = {challenge};
    const verifyPresentationOptions = {
      checks: ['proof'],
      challenge
    };

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('Verifiable credentials MUST contain a type property with an ' +
        'associated value.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20contain%20a%20type%20property%20with%20an%20associated%20value.`;
        await assert.rejects(
          endpoints.issue(require('./input/credential-no-type-fail.json')),
          'Failed to reject a VC without a type.');
      });
      it('Verifiable presentations MUST contain a type property with an ' +
        'associated value.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=Verifiable%20credentials%20and%20verifiable%20presentations%20MUST%20contain%20a%20type%20property%20with%20an%20associated%20value.`;
        await assert.rejects(endpoints.verifyVp(require(
          './input/presentation-no-type-fail.json')),
        'Failed to reject a VP without a type.');
      });
      it('The value of the type property MUST be one or more terms and/or ' +
        'absolute URL strings.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=The%20value%20of%20the%20type%20property%20MUST%20be%20one%20or%20more%20terms%20and/or%20absolute%20URL%20strings.`;
        // type is URL: OK
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-type-url-ok.json')),
        'Failed to accept a VC with an additional type as a URL.');
        // type mapping to URL: OK
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-type-mapped-url-ok.json')),
        'Failed to accept a VC with an additional type defined in the \
        `@context`.');
        // type mapped not to URL: fail
        await assert.rejects(endpoints.issue(require(
          './input/credential-type-mapped-nonurl-fail.json')),
        'Failed to reject a VC with type mapped to an invalid URL.');
        // type not mapped: fail
        await assert.rejects(endpoints.issue(require(
          './input/credential-type-unmapped-fail.json')),
        'Failed to reject a VC with an unmapped (via `@context`) type.');
      });
      it('If more than one (type) value is provided, the order does not ' +
        'matter.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=If%20more%20than%20one%20value%20is%20provided%2C%20the%20order%20does%20not%20matter.`;
        //issue VC with multiple urls in type property
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-type-urls-order-1-ok.json')),
        'Failed to accept a VC with different type array ordering (VC type \
        last).');
        //issue another VC with same urls in a different order
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-type-urls-order-2-ok.json')),
        'Failed to accept a VC with different type array ordering (VC type \
        middle).');
      });
      // Verifiable Credential MUST have a type specified
      it('Verifiable Credential objects MUST have a type specified.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(require(
            './input/credential-optional-type-ok.json')),
          'Failed to accept a VC with additional type.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-missing-required-type-fail.json')),
          'Failed to reject a VC missing the `VerifiableCredential` type.');
        }
      );
      // Verifiable Presentation MUST have a type specified
      it('Verifiable Presentation objects MUST have a type specified.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          const presentationOptionalType = await endpoints.createVp({
            presentation: require('./input/presentation-optional-type-ok.json'),
            options: createOptions
          });
          await assert.doesNotReject(endpoints.verifyVp(
            presentationOptionalType,
            verifyPresentationOptions
          ), 'Failed to accept VP with `@context` mapped type.');
          await assert.rejects(
            endpoints.verifyVp(require(
              './input/presentation-missing-required-type-fail.json')),
            'Failed to reject VP missing `VerifiableCredential` type.');
        }
      );
      // credentialStatus MUST have a type specified.
      it('`credentialStatus` objects MUST have a type specified.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-status-ok.json')),
          'Failed to accept a VC with `credentialStatus` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-status-missing-type-fail.json')),
          'Failed to reject a VC with `credentialStatus` without a `type`.');
        }
      );
      // termsOfUse MUST have a type specified.
      it('`termsOfUse` objects MUST have a type specified.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(require(
            './input/credential-termsofuse-ok.json')),
          'Failed to accept a VC with `termsOfUse` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-termsofuse-missing-type-fail.json')),
          'Failed to reject a VC with `termsOfUse` without a `type`.');
        }
      );
      // evidence MUST have a type specified.
      it('`evidence` objects MUST have a type specified.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-evidence-ok.json')),
          'Failed to accept a VC with `evidence` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-evidence-missing-type-fail.json')),
          'Failed to reject a VC with `evidence` without a `type`.');
        }
      );
      it('`refreshService` objects MUST have a type specified.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-refresh-type-ok.json')),
          'Failed to accept a VC with `refreshService` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-refresh-no-type-fail.json')),
          'Failed to reject a VC with `refreshService` without a `type`.');
        }
      );
      it('`credentialSchema` objects MUST have a type specified.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#types:~:text=the%20following%20table%20lists%20the%20objects%20that%20MUST%20have%20a%20type%20specified.`;
          await assert.doesNotReject(endpoints.issue(
            require('./input/credential-schema-type-ok.json')),
          'Failed to accept a VC with `credentialSchema` with a `type`.');
          await assert.rejects(endpoints.issue(require(
            './input/credential-schema-no-type-fail.json')),
          'Failed to reject `credentialSchema` without a `type`.');
        }
      );
    });
  }
});

// 4.5 Names and Descriptions https://w3c.github.io/vc-data-model/#names-and-descriptions
// These tests for name and descrpition are OPTIONAL as those properties may
// appear anywhere. However, we have tests for them (on `issuer` so far), so
// keeping them in play seems prudent/useful. They can be expanded later also
// to cover `name` and/or `description` anywhere they appear.
describe('Names and Descriptions', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      const fixturePath = './input/names-and-descriptions';
      // On the main credential object itself--as the spec describes
      it('If present, the value of the name property MUST be a string or a ' +
        'language value object as described in 11.1 Language and Base ' +
        'Direction.', async function() {
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
        'Failed to reject a VC with `name` containing extra properties.');
      });
      it('If present, the value of the description property MUST be a string ' +
        'or a language value object as described in 11.1 Language and Base ' +
        'Direction.', async function() {
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
        'Failed to reject a VC with `description` containing extra ' +
        'properties.');
      });

      // On `issuer` as in the example at https://w3c.github.io/vc-data-model/#example-usage-of-the-name-and-description-property-0
      it('If present (on `issuer`), the value of the name property MUST be a ' +
        'string or a language value object as described in 11.1 Language and ' +
        'Base Direction.', async function() {
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
        'Failed to reject a VC with `issuer.name` containing extra ' +
        'properties.');
      });
      it('If present (on `issuer`), the value of the description property ' +
        'MUST be a string or a language value object as described in 11.1 ' +
        'Language and Base Direction.', async function() {
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
        'Failed to reject a VC with `issuer.description` containing extra ' +
        'properties.');
      });
    });
  }
});

// 4.6 Credential Subject https://w3c.github.io/vc-data-model/#credential-subject
describe('Credential Subject', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('A verifiable credential MUST have a credentialSubject ' +
        'property.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#credential-subject:~:text=A%20verifiable%20credential%20MUST%20have%20a%20credentialSubject%20property.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-no-subject-fail.json')),
        'Failed to rejet a VC without a `credentialSubject`.');
      });
      it('The value of the credentialSubject property is defined as a ' +
        'set of objects where each object MUST be the subject of one or more ' +
        'claims, which MUST be serialized inside the credentialSubject ' +
        'property.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#credential-subject:~:text=The%20value%20of%20the%20credentialSubject%20property%20is%20defined%20as%20a%20set%20of%20objects%20where%20each%20object%20MUST%20be%20the%20subject%20of%20one%20or%20more%20claims%2C%20which%20MUST%20be%20serialized%20inside%20the%20credentialSubject%20property.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-subject-no-claims-fail.json')),
        'Failed to reject a VC with an empty `credentialSubject`.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-subject-multiple-ok.json')),
        'Failed to accept a VC with multiple `credentialSubject`s.');
        // TODO: reconsider whether an empty object is a violation; as long as
        // at least one claim object is included...is there any harm in throwing
        // out the empties?
        await assert.rejects(
          endpoints.issue(require(
            './input/credential-subject-multiple-empty-fail.json')),
          'Failed to reject VC containing an empty `credentialSubject`.');
      });
    });
  }
});

// 4.7 Issuer https://w3c.github.io/vc-data-model/#issuer
describe('Issuer', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('A verifiable credential MUST have an issuer property.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#issuer:~:text=A%20verifiable%20credential%20MUST%20have%20an%20issuer%20property.`;
          const vc = await endpoints.issue(
            require('./input/credential-ok.json'));
          vc.hasOwnProperty('issuer');
        });
      it('The value of the issuer property MUST be either a URL, or ' +
        'an object containing an id property whose value is a URL.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#issuer:~:text=The%20value%20of%20the%20issuer%20property%20MUST%20be%20either%20a%20URL%2C%20or%20an%20object%20containing%20an%20id%20property%20whose%20value%20is%20a%20URL`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-issuer-object-ok.json')));
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-no-url-fail.json')),
        'Failed to reject an issuer identifier that was not a URL.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-null-fail.json')),
        'Failed to reject a null issuer identifier.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-object-id-null-fail.json')),
        'Failed to reject an issuer object containing a null identifier.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-issuer-object-id-no-url-fail.json')),
        'Failed to reject an issuer object containing a non-URL identifier.');
      });
    });
  }
});

// 4.8 Validity Period https://w3c.github.io/vc-data-model/#validity-period
describe('Validity Period', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If present, the value of the validFrom property MUST be an ' +
        '[XMLSCHEMA11-2] dateTimeStamp string value representing the date ' +
        'and time the credential becomes valid, which could be a date and ' +
        'time in the future or in the past.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20present%2C%20the%20value%20of%20the%20validFrom%20property%20MUST%20be%20an%20%5BXMLSCHEMA11%2D2%5D%20dateTimeStamp%20string%20value%20representing%20the%20date%20and%20time%20the%20credential%20becomes%20valid%2C%20which%20could%20be%20a%20date%20and%20time%20in%20the%20future%20or%20in%20the%20past.`;
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validfrom-ms-ok.json')),
        'Failed to accept a VC with a valid `validFrom` date-time.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validfrom-tz-ok.json')),
        'Failed to accept a VC using the subtractive timezone format.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-validfrom-invalid-fail.json')),
        'Failed to reject a VC using an incorrect `validFrom` date-time \
        format.');
        // TODO: add validFrom in the future test vector.
      });
      it('If present, the value of the validUntil property MUST be an ' +
        '[XMLSCHEMA11-2] dateTimeStamp string value representing the date ' +
        'and time the credential ceases to be valid, which could be a date ' +
        'and time in the past or in the future.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20present%2C%20the%20value%20of%20the%20validUntil%20property%20MUST%20be%20an%20%5BXMLSCHEMA11%2D2%5D%20dateTimeStamp%20string%20value%20representing%20the%20date%20and%20time%20the%20credential%20ceases%20to%20be%20valid%2C%20which%20could%20be%20a%20date%20and%20time%20in%20the%20past%20or%20in%20the%20future`;
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-validuntil-ok.json')),
        'Failed to accept a VC with a valid `validUntil` date-time.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validuntil-ms-ok.json')),
        'Failed to accept a VC using miliseconds in `validUntil`.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-validuntil-tz-ok.json')),
        'Failed to accept a VC using the subtractive timezone format.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-validuntil-invalid-fail.json')),
        'Failed to reject a VC using an inccorect `validUntil` date-time \
        format.');
      });
      it('If a validUntil value also exists, the validFrom value MUST ' +
        'express a datetime that is temporally the same or earlier than the ' +
        'datetime expressed by the validUntil value.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20a%20validUntil%20value%20also%20exists%2C%20the%20validFrom%20value%20MUST%20express%20a%20datetime%20that%20is%20temporally%20the%20same%20or%20earlier%20than%20the%20datetime%20expressed%20by%20the%20validUntil%20value.`;
        const positiveTest = require(
          './input/credential-validUntil-validFrom-ok.json');
        positiveTest.validFrom = createTimeStamp({skew: -1 * oneYear});
        positiveTest.validUntil = createTimeStamp({skew: oneYear});
        await assert.doesNotReject(endpoints.issue(positiveTest),
          'Failed to accept a VC with a `validUntil` after its `validFrom`.');
        const negativeTest = require(
          './input/credential-validUntil-validFrom-fail.json');
        negativeTest.validFrom = createTimeStamp({skew: oneYear});
        negativeTest.validUntil = createTimeStamp({skew: -1 * oneYear});
        await shouldRejectEitherIssueOrVerify({
          endpoints,
          negativeTest,
          reason: 'Failed to reject a VC with a `validUntil` before its ' +
          '`validFrom`.`'
        });
      });
      // TODO: the following tests are identical to the above; refactor.
      it('If a validFrom value also exists, the validUntil value MUST ' +
        'express a datetime that is temporally the same or later than the ' +
        'datetime expressed by the validFrom value.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=If%20a%20validFrom%20value%20also%20exists%2C%20the%20validUntil%20value%20MUST%20express%20a%20datetime%20that%20is%20temporally%20the%20same%20or%20later%20than%20the%20datetime%20expressed%20by%20the%20validFrom%20value.`;
        const positiveTest = require(
          './input/credential-validUntil-validFrom-ok.json');
        positiveTest.validFrom = createTimeStamp({skew: -1 * oneYear});
        positiveTest.validUntil = createTimeStamp({skew: oneYear});
        await assert.doesNotReject(endpoints.issue(positiveTest),
          'Failed to accept a VC with a `validUntil` after its `validFrom`.');
        const negativeTest = require(
          './input/credential-validUntil-validFrom-fail.json');
        negativeTest.validFrom = createTimeStamp({skew: oneYear});
        negativeTest.validUntil = createTimeStamp({skew: -1 * oneYear});
        await shouldRejectEitherIssueOrVerify({
          endpoints,
          negativeTest,
          reason: 'Failed to reject a VC with a `validUntil` before its ' +
          '`validFrom`.'
        });
      });
      // 4.8.1 Representing Time https://w3c.github.io/vc-data-model/#representing-time
      it.skip('Time values that are incorrectly serialized without an offset ' +
        'MUST be interpreted as UTC.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#validity-period:~:text=Time%20values%20that%20are%20incorrectly%20serialized%20without%20an%20offset%20MUST%20be%20interpreted%20as%20UTC.`;
        // TODO: add test using regular expression from spec.
        // https://w3c.github.io/vc-data-model/#example-regular-expression-to-detect-a-valid-xml-schema-1-1-part-2-datetimestamp
        // eslint-disable-next-line max-len, no-unused-vars
        const regexp = /-?([1-9][0-9]{3,}|0[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?|(24:00:00(\.0+)?))(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))/;
      });
    });
  }
});

// 4.9 Securing Mechanisms https://w3c.github.io/vc-data-model/#securing-mechanisms
describe('Securing Mechanisms', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      let issuedVc;
      before(async function() {
        try {
          issuedVc = await endpoints.issue(require(
            './input/credential-ok.json'));
        } catch(e) {
          console.error(
            `Issuer: ${name} failed to issue "credential-ok.json".`,
            e
          );
        }
      });
      beforeEach(addPerTestMetadata);

      // as of VC 2.0 this means a proof must be attached to an issued VC
      // at least one proof must be on an issued VC
      // TODO: maybe move this up to the 1.3 Conformance section it's from?
      it('A conforming document MUST be secured by at least one ' +
        'securing mechanism as described in Section 4.9 Securing Mechanisms.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#securing-mechanisms:~:text=A%20conforming%20document%20MUST%20be%20secured%20by%20at%20least%20one%20securing%20mechanism%20as%20described%20in%20Section%204.9%20Securing%20Mechanisms.`;
        // embedded proof test
        // TODO: confirm these `exist` tests actually work; chaining seems off
        should.exist(issuedVc, `Expected ${name} to issue a VC.`);
        should.exist(issuedVc.proof, 'Expected VC to have a proof.');
        if(Array.isArray(issuedVc.proof)) {
          issuedVc.proof.length.should.be.gt(0, 'Expected at least one proof.');
          issuedVc.proof.every(p => typeof p === 'object').should.be.true;
        } else {
          issuedVc.proof.should.be.an(
            'object',
            'Expected proof to be an object.'
          );
        }
        // TODO: add enveloped proof test
      });
      it('A conforming issuer implementation produces conforming ' +
        'documents, MUST include all required properties in the conforming ' +
        'documents that it produces, and MUST secure the conforming ' +
        'documents it produces using a securing mechanism as described in ' +
        'Section 4.9 Securing Mechanisms.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#securing-mechanisms:~:text=A%20conforming%20issuer%20implementation%20produces%20conforming%20documents%2C%20MUST%20include%20all%20required%20properties%20in%20the%20conforming%20documents%20that%20it%20produces%2C%20and%20MUST%20secure%20the%20conforming%20documents%20it%20produces%20using%20a%20securing%20mechanism%20as%20described%20in%20Section%204.9%20Securing%20Mechanisms.`;
        should.exist(issuedVc, `Expected ${name} to issue a VC.`);
        should.exist(issuedVc.proof, 'Expected VC to have a proof.');
        // TODO: add enveloped proof test
      });
      it('A conforming verifier implementation consumes conforming ' +
        'documents, MUST perform verification on a conforming document as ' +
        'described in Section 4.9 Securing Mechanisms, MUST check that each ' +
        'required property satisfies the normative requirements for that ' +
        'property, and MUST produce errors when non-conforming documents are ' +
        'detected.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#securing-mechanisms:~:text=A%20conforming%20verifier,documents%20are%20detected.`;
        // TODO: this verify is neither awaited nor tested; so just expecting
        // it to throw? We should be more explicit.
        endpoints.verify(issuedVc);
        // should reject a VC without a proof
        // TODO: VCs are not required to have a `proof` for verification; they
        // may be "enveloped" instead.
        assert.rejects(endpoints.verify(require('./input/credential-ok.json')),
          'Failed to reject a VC missing a `proof`.');
        // TODO: add enveloped proof test
      });
    });
  }
});

// 4.10 Status https://w3c.github.io/vc-data-model/#status
describe('Status', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If present (credentialStatus.id), the normative guidance ' +
        'in Section 4.3 Identifiers MUST be followed.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#status:~:text=credential%20status%20object.-,If%20present%2C%20the%20normative%20guidance%20in%20Section%204.3%20Identifiers%20MUST%20be%20followed.,-type`;
        // id is optional
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-status-missing-id-ok.json')),
        'Failed to accept a VC with `credentialStatus` without an `id`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-multiple-id-fail.json')),
        'Failed to reject a VC with multiple `credentialStatus.id` values.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-nonurl-id-fail.json')),
        'Failed to reject a VC with a non-URL `credentialStatus.id`.');
      });
      it('(If a credentialStatus property is present), The type ' +
        'property is REQUIRED. It is used to express the type of status ' +
        'information expressed by the object. The related normative ' +
        'guidance in Section 4.4 Types MUST be followed.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#status:~:text=The%20type%20property%20is%20REQUIRED.%20It%20is%20used%20to%20express%20the%20type%20of%20status%20information%20expressed%20by%20the%20object.%20The%20related%20normative%20guidance%20in%20Section%204.4%20Types%20MUST%20be%20followed.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-missing-type-fail.json')),
        'Failed to reject a VC missing `credentialStatus.type`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-status-type-nonurl-fail.json')),
        'Failed to reject a VC with a non-URL `credentialStatus.type`.');
        await assert.doesNotReject(endpoints.issue(require(
          './input/credential-status-ok.json')),
        'Failed to accept a VC with a valid `credentialStatus`.');
      });
      it.skip('Status schemes MUST NOT be implemented in ways that enable ' +
        'tracking of individuals', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#status:~:text=Status%20schemes%20MUST%20NOT%20be%20implemented%20in%20ways%20that%20enable%20tracking%20of%20individuals`;
        // not testable with automation
      });
    });
  }
});

// 4.11 Verifiable Credentials https://w3c.github.io/vc-data-model/#verifiable-credentials
// There are no actual MUSTs here, just references to other sections.

// 4.12 Verifiable Presentations https://w3c.github.io/vc-data-model/#verifiable-presentations
describe('Verifiable Presentations', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});
    const createOptions = {challenge};
    const verifyPresentationOptions = {
      checks: ['proof'],
      challenge
    };

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('If [the `id` field is] present, the normative guidance in Section ' +
        '4.3 Identifiers MUST be followed.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-credentials:~:text=verifiable%20presentation.-,If%20present%2C%20the%20normative%20guidance%20in%20Section%204.3%20Identifiers%20MUST%20be%20followed.,-type`;
        // TODO: implement test
        this.skip();
      });

      it('The type property MUST be present. One value of this property MUST ' +
        'be VerifiablePresentation, but additional types MAY be included.' +
        'The related normative guidance in Section 4.4 Types MUST be followed.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-credentials:~:text=The%20type%20property%20MUST%20be%20present.%20It%20is%20used%20to%20express%20the%20type%20of%20verifiable%20presentation.%20One%20value%20of%20this%20property%20MUST%20be%20VerifiablePresentation%2C%20but%20additional%20types%20MAY%20be%20included.%20The%20related%20normative%20guidance%20in%20Section%204.4%20Types%20MUST%20be%20followed.`;
        // TODO: implement test
        this.skip();
      });

      it('The verifiableCredential property MAY be present. The value MUST ' +
        'be one or more verifiable credential and/or enveloped verifiable ' +
        'credential objects (to be clear, the values MUST NOT be non-object ' +
        'values such as numbers, strings, or URLs).', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#verifiable-credentials:~:text=The%20verifiableCredential%20property%20MAY%20be%20present.%20The%20value%20MUST%20be%20one%20or%20more%20verifiable%20credential%20and/or%20enveloped%20verifiable%20credential%20objects%20(to%20be%20clear%2C%20the%20values%20MUST%20NOT%20be%20non%2Dobject%20values%20such%20as%20numbers%2C%20strings%2C%20or%20URLs).`;
        //FIXME remove the internal prove once VC-API presentation
        //creation is stabilized
        const presentationWithCredential = await endpoints.createVp({
          presentation: require('./input/presentation-vc-ok.json'),
          options: createOptions
        });
        await endpoints.verifyVp(
          presentationWithCredential,
          verifyPresentationOptions
        );
        // FIXME support for derived VCs is not standard yet
        // and probably will be its own test suite
        //await endpoints.verifyVp(require(
        //  './input/presentation-derived-vc-ok.json'));

        // FIXME remove internal prove once VC-API presentation
        // creation is finalized
        const presentationWithCredentials = await endpoints.createVp({
          presentation: require('./input/presentation-multiple-vc-ok.json'),
          options: createOptions
        });
        await endpoints.verifyVp(
          presentationWithCredentials,
          verifyPresentationOptions
        );
        await assert.rejects(endpoints.verifyVp(require(
          './input/presentation-vc-missing-required-type-fail.json')),
        'Failed to reject a VP containing a VC with no `type` value.');
        await assert.rejects(endpoints.verifyVp(require(
          './input/presentation-derived-vc-missing-required-type-fail.json')),
        'Failed to reject a derived VP with a missing `type`.');
      });
    });
  }
});

// 4.12.1 Enveloped Verifiable Credentials https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials
describe('VP - Enveloped Verifiable Credentials', function() {
  setupMatrix.call(this);
  for(const [name] of match) {

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('The @context property of the object MUST be present and include a ' +
        'context, such as the base context for this specification, that ' +
        'defines at least the id, type, and EnvelopedVerifiableCredential ' +
        'terms as defined by the base context provided by this specification.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20%40context%20property%20of%20the%20object%20MUST%20be%20present%20and%20include%20a%20context%2C%20such%20as%20the%20base%20context%20for%20this%20specification%2C%20that%20defines%20at%20least%20the%20id%2C%20type%2C%20and%20EnvelopedVerifiableCredential%20terms%20as%20defined%20by%20the%20base%20context%20provided%20by%20this%20specification.`;
        // TODO: implement test
        this.skip();
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable credential using an enveloping ' +
        'security scheme, such as Securing Verifiable Credentials using JOSE ' +
        'and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20credential%20using%20an%20enveloping%20security%20scheme%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;
        // TODO: implement test
        this.skip();
      });

      it('The type value of the object MUST be EnvelopedVerifiableCredential.',
        async function() {
          this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-credentials:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiableCredential.`;
          // TODO: implement test
          this.skip();
        });
    });
  }
});

// 4.12.2 Enveloped Verifiable Presentations https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations
describe('VP - Enveloped Verifiable Presentations', function() {
  setupMatrix.call(this);
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
        this.skip();
      });

      it('The id value of the object MUST be a data: URL [RFC2397] that ' +
        'expresses a secured verifiable presentation using an enveloping ' +
        'securing mechanism, such as Securing Verifiable Credentials using ' +
        'JOSE and COSE [VC-JOSE-COSE].', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20id%20value%20of%20the%20object%20MUST%20be%20a%20data%3A%20URL%20%5BRFC2397%5D%20that%20expresses%20a%20secured%20verifiable%20presentation%20using%20an%20enveloping%20securing%20mechanism%2C%20such%20as%20Securing%20Verifiable%20Credentials%20using%20JOSE%20and%20COSE%20%5BVC%2DJOSE%2DCOSE%5D.`;
        // TODO: implement test
        this.skip();
      });

      it('The type value of the object MUST be ' +
        'EnvelopedVerifiablePresentation.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#enveloped-verifiable-presentations:~:text=The%20type%20value%20of%20the%20object%20MUST%20be%20EnvelopedVerifiablePresentation.`;
        // TODO: implement test
        this.skip();
      });
    });
  }
});

// 4.12.4 Presentations Including Holder Claims https://w3c.github.io/vc-data-model/#presentations-including-holder-claims
describe('VP - Presentations Including Holder Claims', function() {
  setupMatrix.call(this);
  for(const [name] of match) {

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('A verifiable presentation that includes a self-asserted verifiable ' +
        'credential that is only secured using the same mechanism as the ' +
        'verifiable presentation MUST include a holder property.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#presentations-including-holder-claims:~:text=A%20verifiable%20presentation%20that%20includes%20a%20self%2Dasserted%20verifiable%20credential%20that%20is%20only%20secured%20using%20the%20same%20mechanism%20as%20the%20verifiable%20presentation%20MUST%20include%20a%20holder%20property.`;
        // TODO: implement test
        this.skip();
      });

      it('When a self-asserted verifiable credential is secured using the ' +
        'same mechanism as the verifiable presentation, the value of the ' +
        'issuer property of the verifiable credential MUST be identical to ' +
        'the holder property of the verifiable presentation.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#presentations-including-holder-claims:~:text=When%20a%20self%2Dasserted%20verifiable%20credential%20is%20secured%20using%20the%20same%20mechanism%20as%20the%20verifiable%20presentation%2C%20the%20value%20of%20the%20issuer%20property%20of%20the%20verifiable%20credential%20MUST%20be%20identical%20to%20the%20holder%20property%20of%20the%20verifiable%20presentation.`;
        // TODO: implement test
        this.skip();
      });
    });
  }
});

// 4.13 Data Schemas https://w3c.github.io/vc-data-model/#data-schemas
describe('Data Schemas', function() {
  setupMatrix.call(this);
  for(const [name, implementation] of match) {
    const endpoints = new TestEndpoints({implementation, tag});

    describe(name, function() {
      beforeEach(addPerTestMetadata);

      it('The value of the credentialSchema property MUST be one or more ' +
        'data schemas that provide verifiers with enough information to ' +
        'determine whether the provided data conforms to the provided ' +
        'schema(s).', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=The%20value%20of%20the%20credentialSchema%20property%20MUST%20be%20one%20or%20more%20data%20schemas%20that%20provide%20verifiers%20with%20enough%20information%20to%20determine%20whether%20the%20provided%20data%20conforms%20to%20the%20provided%20schema(s).`;
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-schema-ok.json')),
        'Failed to accept a VC containing a valid `credentialSchema`.');
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-schemas-ok.json')),
        'Failed to accept a VC containing multiple valid `credentialSchema`.');
      });

      it('Each credentialSchema MUST specify its type (for example, ' +
        'JsonSchema), and an id property that MUST be a URL identifying the ' +
        'schema file.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=Each%20credentialSchema%20MUST%20specify%20its%20type%20(for%20example%2C%20JsonSchema)%2C%20and%20an%20id%20property%20that%20MUST%20be%20a%20URL%20identifying%20the%20schema%20file.`;
        await assert.rejects(endpoints.issue(require(
          './input/credential-schema-no-type-fail.json')),
        'Failed to reject `credentialSchema` without a `type`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-schema-no-id-fail.json')),
        'Failed to reject `credentialSchema` without an `id`.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-schema-non-url-id-fail.json')),
        'Failed to reject `credentialSchema` with a numerid `id`.');
      });

      it('If multiple schemas are present, validity is determined according ' +
        'to the processing rules outlined by each associated ' +
        'credentialSchema type property.', async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#data-schemas:~:text=If%20multiple%20schemas%20are%20present%2C%20validity%20is%20determined%20according%20to%20the%20processing%20rules%20outlined%20by%20each%20associated%20credentialSchema%20type%20property.`;
        // TODO: this doesn't really test the above statement...
        await assert.doesNotReject(endpoints.issue(
          require('./input/credential-schemas-ok.json')),
        'Failed to accept a VC containing multiple valid `credentialSchema`.');
      });
    });
  }
});

// 5. Advanced Concepts https://w3c.github.io/vc-data-model/#advanced-concepts
describe('Advanced Concepts', function() {
  setupMatrix.call(this);
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
        'Failed to reject a VC which redefines the `VerifiableCredential` \
        type.');
        await assert.rejects(endpoints.issue(require(
          './input/credential-redef-type2-fail.json')),
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
            './input/credential-refresh-no-type-fail.json')));
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
      it('The value of the evidence property MUST be one or more ' +
        'evidence schemes providing enough information for a verifier to ' +
        'determine whether the evidence gathered by the issuer meets its ' +
        'confidence requirements for relying on the credential.',
      async function() {
        this.test.link = `https://w3c.github.io/vc-data-model/#evidence:~:text=The%20value%20of%20the%20evidence%20property%20MUST%20be%20one%20or%20more%20evidence%20schemes%20providing%20enough%20information%20for%20a%20verifier%20to%20determine%20whether%20the%20evidence%20gathered%20by%20the%20issuer%20meets%20its%20confidence%20requirements%20for%20relying%20on%20the%20credential.`;
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

// 7.2 Problem Details https://w3c.github.io/vc-data-model/#verification
// TODO: optionaly response format; but we could write tests for it

// 11.1 Language and Base Direction https://w3c.github.io/vc-data-model/#language-and-base-direction
// TODO: possibly already covered by Name and Description tests
