/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  createRequestBody,
  createVerifyRequestBody
} from './mock.data.js';
import {createTimeStamp, proveVP} from './data-generator.js';
import assert from 'node:assert/strict';
import {createRequire} from 'module';
import {filterByTag} from 'vc-api-test-suite-implementations';
import http from 'http';
import {randomFillSync} from 'node:crypto';
import receiveJson from './receive-json.js';

const require = createRequire(import.meta.url);
const baseContextUrl = 'https://www.w3.org/ns/credentials/v2';

const vcApiTag = 'vc2.0';
const {match} = filterByTag({tags: [vcApiTag]});

describe('Verifiable Credentials Data Model v2.0', function() {
  const summaries = new Set();
  this.summary = summaries;
  const reportData = [];
  // this will tell the report
  // to make an interop matrix with this suite
  this.matrix = true;
  this.report = true;
  this.implemented = [...match.keys()];
  this.rowLabel = 'Test Name';
  this.columnLabel = 'Issuer';
  // the reportData will be displayed under the test title
  this.reportData = reportData;
  for(const [name, implementation] of match) {
    const issuer = implementation.issuers.find(
      issuer => issuer.tags.has(vcApiTag));
    const verifier = implementation.verifiers.find(
      verifier => verifier.tags.has(vcApiTag));
    const vpVerifier = implementation.vpVerifiers.find(
      vpVerifier => vpVerifier.tags.has(vcApiTag));
    function it2(title, fn) {
      it(title, async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        await fn.apply(this, arguments);
      });
    }

    async function post(endpoint, object) {
      const url = endpoint.settings.endpoint;
      if(url.startsWith('https:')) {
        // Use vc-api-test-suite-implementations for HTTPS requests.
        const {data, error} = await endpoint.post({json: object});
        if(error) {
          throw error;
        }
        return data;
      }
      const postData = Buffer.from(JSON.stringify(object));
      const res = await new Promise((resolve, reject) => {
        const req = http.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
            Accept: 'application/json'
          }
        }, resolve);
        req.on('error', reject);
        req.end(postData);
      });
      const result = await receiveJson(res);
      if(res.statusCode >= 400) {
        if(result != null && result.errors) {
          throw new Error(result.errors);
        }
        throw new Error(result);
      }
      if(res.statusCode >= 300) {
        throw new Error('Redirect not supported');
      }
      return result;
    }

    async function issue(credential) {
      const issueBody = createRequestBody({issuer, vc: credential});
      return post(issuer, issueBody);
    }

    async function verify(vc) {
      const verifyBody = createVerifyRequestBody({vc});
      const result = await post(verifier, verifyBody);
      if(result?.errors?.length) {
        throw result.errors[0];
      }
      return result;
    }

    async function verifyVp(vp, options = {checks: []}) {
      const body = {
        verifiablePresentation: vp,
        options
      };
      const result = await post(vpVerifier, body);
      if(result?.errors?.length) {
        throw result.errors[0];
      }
      return result;
    }
    // use base64 encoded 128 bit number as the challenge
    const buf = Buffer.alloc(16); // 128 bits
    const challenge = 'u' + randomFillSync(buf).toString('base64url');
    const proveOptions = {challenge};
    const verifyPresentationOptions = {
      checks: ['proof'],
      challenge
    };

    describe(name, function() {
      it.skip('Conforming document (compliance): VCDM "MUST be enforced." ' +
        '("all relevant normative statements in Sections 4. Basic Concepts, ' +
        '5. Advanced Concepts, and 6. Syntaxes")', async function() {
      });
      // Basic
      it.skip('A serialization format for the conforming document MUST be ' +
        'deterministic, bi-directional, and lossless as described in Section ' +
        '6. Syntaxes.', async function() {
      });
      it2('verifiers MUST produce errors when non-conforming documents are ' +
        'detected.', async function() {
        const doc = {
          type: ['NonconformingDocument']
        };
        await assert.rejects(verify(doc));
        await assert.rejects(verifyVp(doc));
      });
      it2('Verifiable credentials MUST include a @context property.',
        async function() {
          // positive @context test
          const vc = await issue(require('./input/credential-ok.json'));
          vc.should.have.property('@context');
          // negative @context test
          await assert.rejects(issue(
            require('./input/credential-no-context-fail.json')));
        });
      it2('Verifiable presentations MUST include a @context property.',
        async function() {
          //FIXME reimplement this once signed VP creation via VC-API
          //has been finalized
          /*
          const vp = await proveVP({
            presentation: require('./input/presentation-ok.json'),
            options: proveOptions
          });
          vp.should.have.property('@context');
          */
          await assert.rejects(verifyVp(
            require('./input/presentation-no-context-fail.json')));
        });
      it2('Verifiable credentials: The value of the @context property MUST ' +
        'be an ordered set where the first item is a URL with the value ' +
        'https://www.w3.org/ns/credentials/v2.', async function() {
        //positive issue test
        const vc = await issue(require('./input/credential-ok.json'));
        assert(Array.isArray(vc['@context']));
        assert.strictEqual(vc['@context'][0], baseContextUrl);
        // negative issue test
        await assert.rejects(issue(
          require('./input/credential-missing-base-context-fail.json')));
      });
      it2('Verifiable presentations: The value of the @context property MUST ' +
        'be an ordered set where the first item is a URL with the value ' +
        'https://www.w3.org/ns/credentials/v2.', async function() {
        //FIXME reimplement this once signed VP creation via VC-API
        //has been finalized
        /*
        const vp = await proveVP({
          presentation: require('./input/presentation-ok.json'),
          options: proveOptions
        });
        assert(Array.isArray(vp['@context']));
        assert.strictEqual(vp['@context'][0], baseContextUrl);
        */
        await assert.rejects(verifyVp(
          require('./input/presentation-missing-base-context-fail.json')));
      });
      it2('Verifiable credential @context: "Subsequent items in the array ' +
        'MUST be composed of any combination of URLs and/or objects where ' +
        'each is processable as a JSON-LD Context."', async function() {
        await issue(require('./input/credential-context-combo1-ok.json'));
        await issue(require('./input/credential-context-combo2-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-context-combo3-fail.json')));
        await assert.rejects(
          issue(require('./input/credential-context-combo4-fail.json')));
      });
      it2('if present: "The id property MUST express an identifier that ' +
        'others are expected to use when expressing statements about a ' +
        'specific thing identified by that identifier."', async function() {
        await issue(require('./input/credential-id-other-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-id-nonidentifier-fail.json')));
      });
      it2('if present: "The id property MUST NOT have more than one value."',
        async function() {
          await issue(require('./input/credential-single-id-ok.json'));
          await issue(require('./input/credential-subject-single-id-ok.json'));
          await assert.rejects(
            issue(require('./input/credential-multi-id-fail.json')));
          await assert.rejects(
            issue(require('./input/credential-subject-multi-id-fail.json')));
        });
      it2('if present: "The value of the id property MUST be a URL which ' +
        'MAY be dereferenced."', async function() {
        await assert.rejects(
          issue(require('./input/credential-not-url-id-fail.json')));
      });
      it2('The value of the id property MUST be a single URL.',
        async function() {
          await assert.rejects(
            issue(require('./input/credential-nonsingle-id-fail.json')));
        });
      it2('Verifiable credentials MUST have a type property.',
        async function() {
          await assert.rejects(
            issue(require('./input/credential-no-type-fail.json')));
        });
      it2('Verifiable presentations MUST have a type property.',
        async function() {
          await assert.rejects(
            verifyVp(require('./input/presentation-no-type-fail.json')));
        });
      it2('The value of the type property MUST be, or map to (through ' +
        'interpretation of the @context property), one or more URLs.',
      async function() {
        // type is URL: OK
        await issue(require('./input/credential-type-url-ok.json'));
        // type mapping to URL: OK
        await issue(require('./input/credential-type-mapped-url-ok.json'));
        // type mapped not to URL: fail
        await assert.rejects(
          issue(require('./input/credential-type-mapped-nonurl-fail.json')));
        // type not mapped: fail
        await assert.rejects(
          issue(require('./input/credential-type-unmapped-fail.json')));
      });
      it2('type property: "If more than one URL is provided, the URLs ' +
        'MUST be interpreted as an unordered set."', async function() {
        //issue VC with multiple urls in type property
        await issue(require('./input/credential-type-urls-order-1-ok.json'));
        //issue another VC with same urls in a different order
        await issue(require('./input/credential-type-urls-order-2-ok.json'));
      });
      // FIXME this needs to be expanded into at least 6 different tests
      // Verifiable Credential MUST have a type specified
      // Verifiable Presentation MUST have a type specified
      // Proof MUST have a type specified.
      // credentialStatus MUST have a type specified.
      // termsOfUse MUST have a type specified.
      // evidence MUST have a type specified.
      it2('list: "objects that MUST have a type specified."', async function() {
        // (Verifiable) credential requires type VerifiableCredential
        // (Verifiable) presentation requires type VerifiablePresentation
        // Additional (more specific) types for these are optional.
        // Missing type property is tested separately.
        await issue(require('./input/credential-optional-type-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-missing-required-type-fail.json')));
        const presentationOptionalType = await proveVP({
          presentation: require('./input/presentation-optional-type-ok.json'),
          options: proveOptions
        });
        await verifyVp(presentationOptionalType, verifyPresentationOptions);
        await assert.rejects(
          verifyVp(require(
            './input/presentation-missing-required-type-fail.json')));

        // Other objects requiring type: proof, credentialStatus, termsOfUse,
        // and evidence.
        // Note: testing proof requires the issuer to allow the input
        // credential to have an existing proof property.
        await issue(require('./input/credential-proof-ok.json'));
        await assert.rejects(
          verify(require('./input/credential-proof-missing-type-fail.json')));
        await issue(require('./input/credential-status-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-status-missing-type-fail.json')));
        await issue(require('./input/credential-termsofuse-ok.json'));
        await assert.rejects(
          issue(require(
            './input/credential-termsofuse-missing-type-fail.json')));
        await issue(require('./input/credential-evidence-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-evidence-missing-type-fail.json')));
      });
      it.skip('All credentials, presentations, and encapsulated objects ' +
        'SHOULD specify, or be associated with, additional more narrow types ' +
        '(like ExampleDegreeCredential, for example) so software systems ' +
        'can more easily detect and process this additional information.',
      async function() {
      });
      it2('A verifiable credential MUST have a credentialSubject property.',
        async function() {
          await assert.rejects(
            issue(require('./input/credential-no-subject-fail.json')));
        });
      it2('The value of the credentialSubject property is defined as a set ' +
        'of objects where each object MUST be the subject of one or more ' +
        'claims, which MUST be serialized inside the credentialSubject ' +
        'property.', async function() {
        await assert.rejects(
          issue(require('./input/credential-subject-no-claims-fail.json')));
        await issue(require('./input/credential-subject-multiple-ok.json'));
        await assert.rejects(
          issue(require(
            './input/credential-subject-multiple-empty-fail.json')));
      });
      it2('A verifiable credential MUST have an issuer property.',
        async function() {
          await assert.rejects(
            issue(require('./input/credential-no-issuer-fail.json')));
        });
      it2('The value of the issuer property MUST be either a URL, or an ' +
        'object containing an id property whose value is a URL.',
      async function() {
        await issue(require('./input/credential-issuer-object-ok.json'));
        await issue(require('./input/credential-issuer-url-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-issuer-nonurl-fail.json')));
        await assert.rejects(
          issue(require('./input/credential-issuer-object-no-id-fail.json')));
        await assert.rejects(issue(require(
          './input/credential-issuer-object-id-not-url-fail.json')));
      });
      it2('If present, the value of the "issuer.name" property MUST be a ' +
        'string or a language value object as described in 10.1 Language and ' +
        'Base Direction.', async function() {
        await issue(require('./input/credential-issuer-name-ok.json'));
        await issue(require(
          './input/credential-issuer-name-optional-ok.json'));
        await issue(require(
          './input/credential-issuer-name-language-en-ok.json'));
        await issue(require(
          './input/credential-issuer-name-language-direction-en-ok.json'));
        await issue(require(
          './input/credential-issuer-multi-language-name-ok.json'));
        await assert.rejects(issue(require(
          './input/credential-issuer-name-extra-prop-en-fail.json')));
      });
      it2('If present, the value of the "issuer.description" property ' +
        'MUST be a string or a language value object as described in 10.1 ' +
        'Language and Base Direction.', async function() {
        await issue(require('./input/credential-issuer-description-ok.json'));
        await issue(require(
          './input/credential-issuer-description-optional-ok.json'));
        await issue(require(
          './input/credential-issuer-description-language-en-ok.json'));
        await issue(require('./input/credential-issuer-description-language-' +
          'direction-en-ok.json'));
        await issue(require(
          './input/credential-issuer-multi-language-description-ok.json'));
        await assert.rejects(issue(require(
          './input/credential-issuer-description-extra-prop-en-fail.json')));
      });
      it2('If present, the value of the validFrom property MUST be an ' +
        '[XMLSCHEMA11-2] dateTimeStamp string value representing the date ' +
        'and time the credential becomes valid, which could be a date and ' +
        'time in the future.', async function() {
        await issue(require('./input/credential-validfrom-ms-ok.json'));
        await issue(require('./input/credential-validfrom-tz-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-validfrom-invalid-fail.json')));
      });
      it2('If present, the value of the validUntil property MUST be a ' +
        'string value of an [XMLSCHEMA11-2] combined date-time string ' +
        'representing the date and time the credential ceases to be valid, ' +
        'which could be a date and time in the past.', async function() {
        await issue(require('./input/credential-validuntil-ok.json'));
        await issue(require('./input/credential-validuntil-ms-ok.json'));
        await issue(require('./input/credential-validuntil-tz-ok.json'));
        await assert.rejects(
          issue(require('./input/credential-validuntil-invalid-fail.json')));
      });
      it2('If a validUntil value also exists, the validFrom value MUST ' +
        'express a datetime that is temporally the same or earlier than the ' +
        'datetime expressed by the validUntil value.', async function() {
        const positiveTest = require(
          './input/credential-validUntil-validFrom-ok.json');
        positiveTest.validFrom = createTimeStamp({skew: -2});
        positiveTest.validUntil = createTimeStamp({skew: 2});
        await issue(positiveTest);
        const negativeTest = require(
          './input/credential-validUntil-validFrom-fail.json');
        negativeTest.validFrom = createTimeStamp({skew: 2});
        negativeTest.validUntil = createTimeStamp({skew: -2});
        let error;
        let result;
        try {
          result = await issue(negativeTest);
        } catch(e) {
          error = e;
        }
        if(error) {
          return;
        }
        assert.rejects(verify(result));
      });
      it2('If a validFrom value also exists, the validUntil value MUST ' +
        'express a datetime that is temporally the same or later than the ' +
        'datetime expressed by the validFrom value.', async function() {
        const positiveTest = require(
          './input/credential-validUntil-validFrom-ok.json');
        positiveTest.validFrom = createTimeStamp({skew: -2});
        positiveTest.validUntil = createTimeStamp({skew: 2});
        await issue(positiveTest);
        const negativeTest = require(
          './input/credential-validUntil-validFrom-fail.json');
        negativeTest.validFrom = createTimeStamp({skew: 2});
        negativeTest.validUntil = createTimeStamp({skew: -2});
        let error;
        let result;
        try {
          result = await issue(negativeTest);
        } catch(e) {
          error = e;
        }
        if(error) {
          return;
        }
        assert.rejects(verify(result));
      });
      // FIXME remove as this doesn't seem to be in the spec
      it.skip('At least one proof mechanism, and the details necessary ' +
        'to evaluate that proof, MUST be expressed for a credential or ' +
        'presentation to be a verifiable credential or verifiable ' +
        'presentation; that is, to be verifiable.', async function() {
      });
      // FIXME remove as this doesn't seem to be in the spec
      it.skip('When embedding a proof, the proof property MUST be used.',
        async function() {
        });
      // FIXME implement this test by asserting on proof.type
      it.skip('The specific method used for an embedded proof MUST be ' +
        'included using the type property.', async function() {
      });
      it2('If present, the value of the credentialStatus property ' +
        'MUST include id and type.', async function() {
        // type requirement is tested elsewhere
        await assert.rejects(
          issue(require('./input/credential-status-missing-id-fail.json')));
      });
      it2('credentialStatus id property MUST be a URL which MAY be ' +
        'dereferenced.', async function() {
        await assert.rejects(
          issue(require('./input/credential-status-nonurl-id-fail.json')));
      });
      it2('In Verifiable Presentations, the verifiableCredential property ' +
        'MAY be present. The value MUST be an array of one or more ' +
        'verifiable credential graphs in a cryptographically verifiable ' +
        'format.', async function() {
        //FIXME remove the internal prove once VC-API presentation
        //creation is stabilized
        const presentationWithCredential = await proveVP({
          presentation: require('./input/presentation-vc-ok.json'),
          options: proveOptions
        });
        await verifyVp(presentationWithCredential, verifyPresentationOptions);
        // FIXME support for derived VCs is not standard yet
        // and probably will be its own test suite
        //await verifyVp(require('./input/presentation-derived-vc-ok.json'));

        // FIXME remove internal prove once VC-API presentation
        // creation is finalized
        const presentationWithCredentials = await proveVP({
          presentation: require('./input/presentation-multiple-vc-ok.json'),
          options: proveOptions
        });
        await verifyVp(presentationWithCredentials, verifyPresentationOptions);
        await assert.rejects(verifyVp(require(
          './input/presentation-vc-missing-required-type-fail.json')));
        await assert.rejects(verifyVp(require(
          './input/presentation-derived-vc-missing-required-type-fail.json')));
      });

      // Advanced
      it2('JSON-LD-based processors MUST produce an error when a JSON-LD ' +
        'context redefines any term in the active context.', async function() {
        // This depends on "@protected" (which is used for the base context).
        await assert.rejects(issue(require(
          './input/credential-redef-type-fail.json')));
        await assert.rejects(issue(require(
          './input/credential-redef-type2-fail.json')));
      });
      it2('The value of the credentialSchema property MUST be one or more ' +
        'data schemas that provide verifiers with enough information to ' +
        'determine whether the provided data conforms to the provided ' +
        'schema(s).', async function() {
        await issue(require('./input/credential-schema-ok.json'));
        await issue(require('./input/credential-schemas-ok.json'));
      });
      it2('Each credentialSchema MUST specify its type (for example, ' +
        'JsonSchemaValidator2018), and an id property.', async function() {
        await assert.rejects(issue(require(
          './input/credential-schema-no-type-fail.json')));
        await assert.rejects(issue(require(
          './input/credential-schema-no-id-fail.json')));
      });
      it2('credentialSchema id MUST be a URL identifying the schema file.',
        async function() {
          await assert.rejects(issue(require(
            './input/credential-schema-non-url-id-fail.json')));
        });
      it.skip('The value of the refreshService property MUST be one or more ' +
        'refresh services that provides enough information to the ' +
        'recipient\'s software such that the recipient can refresh the ' +
        'verifiable credential.', async function() {
        await issue(require('./input/credential-refresh-ok.json'));
        await issue(require('./input/credential-refreshs-ok.json'));
      });
      it.skip('Each refreshService value MUST specify its type (for example, ' +
        'ManualRefreshService2018) and its id, which is the URL of the ' +
        'service.', async function() {
        await assert.rejects(issue(require(
          './input/credential-refresh-no-type-fail.json')));
        await assert.rejects(issue(require(
          './input/credential-refresh-no-id-fail.json')));
        await assert.rejects(issue(require(
          './input/credential-refresh-non-url-id-fail.json')));
      });
      it2('The value of the termsOfUse property MUST specify one or more ' +
        'terms of use policies under which the creator issued the credential ' +
        'or presentation.', async function() {
        await issue(require('./input/credential-termsofuses-ok.json'));
      });
      it2('Each termsOfUse value MUST specify its type, for example, ' +
        'IssuerPolicy, and MAY specify its instance id.', async function() {
        await assert.rejects(issue(require(
          './input/credential-termsofuse-no-type-fail.json')));
        await issue(require('./input/credential-termsofuse-id-ok.json'));
      });
      it2('The value of the evidence property MUST be one or more evidence ' +
        'schemes providing enough information for a verifier to determine ' +
        'whether the evidence gathered by the issuer meets its confidence ' +
        'requirements for relying on the credential.', async function() {
        await issue(require('./input/credential-evidences-ok.json'));
      });
      it.skip('(ZKP) The verifiable credential MUST contain a Proof, using ' +
        'the proof property, so that the holder can derive a verifiable ' +
        'presentation that reveals only the information than the holder ' +
        'intends to reveal.', async function() {
      });
      it.skip('(ZKP) If a credential definition is being used, the ' +
        'credential definition MUST be defined in the credentialSchema ' +
        'property, so that it can be used by all parties to perform various ' +
        'cryptographic operations in zero-knowledge.', async function() {
      });
      it.skip('(ZKP) Each derived verifiable credential within a ' +
        'verifiable presentation MUST contain all information necessary ' +
        'to verify the verifiable credential, either by including it ' +
        'directly within the credential, or by referencing the necessary ' +
        'information.', async function() {
      });
      it.skip('A verifiable presentation MUST NOT leak information that ' +
        'would enable the verifier to correlate the holder across multiple ' +
        'verifiable presentations.', async function() {
      });
      // Syntaxes
      // FIXME this is a good statement, but not in the spec
      it.skip('Data model mapping property values to JSON types ' +
        '(not numeric/boolean/sequence/ordered-set/set/empty): "Other values ' +
        'MUST be represented as a String type."', async function() {
      });
    });
  }
});
