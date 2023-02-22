/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {
  createISOTimeStamp,
  createRequestBody,
  createVerifyRequestBody
} from './mock.data.js';
import {
  shouldBeIssuedVc,
  shouldReturnResult,
  shouldThrowInvalidInput
} from './assertions.js';
import chai from 'chai';
import assert from 'node:assert/strict';
import {filterByTag} from 'vc-api-test-suite-implementations';
import {createRequire} from 'module';
const require = createRequire(import.meta.url);
import http from 'http';
import receiveJson from './receive-json.js';
const baseContextUrl = 'https://www.w3.org/ns/credentials/v2';

const should = chai.should();
const vcApiTag = 'vcdm2';
let {match, nonMatch} = filterByTag({tags: [vcApiTag, 'vcdm2']});

import doServer from '../example-server.js'
const example = await doServer();
match.set(example.name, example.implementation);
after(async function () {
  await example.stop();
});

describe('Verifiable Credentials Data Model v2.0', function() {
  const summaries = new Set();
  this.summary = summaries;
  const reportData = [];
  // this will tell the report
  // to make an interop matrix with this suite
  this.matrix = true;
  this.report = true;
  this.implemented = [...match.keys()];
  this.notImplemented = [...nonMatch.keys()];
  this.rowLabel = 'Test Name';
  this.columnLabel = 'Issuer';
  // the reportData will be displayed under the test title
  this.reportData = reportData;
  for(const [name, implementation] of match) {
    const issuer = implementation.issuers.find(
      issuer => issuer.tags.has(vcApiTag));
    const verifier = implementation.verifiers.find(
      verifier => verifier.tags.has(vcApiTag));
    const prover = implementation.provers.find(
      prover => prover.tags.has(vcApiTag));
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
            'Accept': 'application/json'
          }
        }, resolve);
        req.on('error', reject);
        req.end(postData);
      });
      const result = await receiveJson(res);
      if(res.statusCode >= 400) {
        throw new Error(result);
      }
      if(res.statusCode >= 300) {
        throw new Error('Redirect not supported');
      }
      return result;
    }

    async function issue(credential) {
      const issueBody = createRequestBody({issuer, vc: credential});
      return await post(issuer, issueBody);
    }

    async function verify(vc) {
      const verifyBody = createVerifyRequestBody({vc});
      const result = await post(verifier, verifyBody);
      if(result.errors.length) {
        throw result.errors[0];
      }
      return data;
    }

    async function prove(presentation) {
      return await post(prover, {
        presentation,
        options: {}
      });
    }

    async function verifyVp(vp) {
      const body = {
        verifiablePresentation: vp,
        options: {
          checks: ['proof'],
        }
      };
      const result = await post(vpVerifier, body);
      if(result.errors.length) {
        throw result.errors[0];
      }
      return result;
    }

    let vc;
    let vp;
    before(async function() {
      const credential = require('./input/1-credential-ok.json');
      // The full verifiableCredential property IRI is used in the VP to work
      // around a FIXME in vc-api-test-suite-implementations/lib/requests.js
      const presentation = require('./input/2-presentation-ok.json');
      vc = await issue(credential);
      vp = await prove(presentation);
    });

    describe(name, function() {
      it.skip('Conforming document (compliance): VCDM "MUST be enforced." ("all relevant normative statements in Sections 4. Basic Concepts, 5. Advanced Concepts, and 6. Syntaxes")', async function() {
      });
      // Basic
      it.skip('"A serialization format for the conforming document MUST be deterministic, bi-directional, and lossless as described in Section 6. Syntaxes."', async function() {
      });
      it2('"Conforming processors MUST produce errors when nonconforming documents are consumed."', async function() {
        const doc = {
          'type': ['NonconformingDocument']
        };
        await assert.rejects(issue(doc));
        await assert.rejects(verify(doc));
        await assert.rejects(prove(doc));
        await assert.rejects(verifyVp(doc));
      });
      it2('"Verifiable credentials and verifiable presentations MUST include a @context property."', async function() {
        vc.should.have.property('@context');
        vp.should.have.property('@context');
        await assert.rejects(issue(
          require('./input/3-credential-no-context-fail.json')));
        await assert.rejects(prove(
          require('./input/4-presentation-no-context-fail.json')));
      });
      it2('Verifiable credentials and verifiable presentations: "The value of the @context property MUST be an ordered set where the first item is a URL with the value https://www.w3.org/ns/credentials/v2."', async function() {
        assert(Array.isArray(vc['@context']));
        assert.strictEqual(vc['@context'][0], baseContextUrl);

        assert(Array.isArray(vp['@context']));
        assert.strictEqual(vp['@context'][0], baseContextUrl);

        await assert.rejects(issue(
          require('./input/5-credential-missing-base-context-fail.json')));
        await assert.rejects(prove(
          require('./input/6-presentation-missing-base-context-fail.json')));
      });
      it2('@context: "Subsequent items in the array MUST express context information and be composed of any combination of URLs or objects."', async function() {
        await issue(require('./input/7-credential-context-combo1-ok.json'));
        await issue(require('./input/8-credential-context-combo2-ok.json'));
        await issue(require('./input/9-credential-context-combo3-ok.json'));
        await assert.rejects(
          issue(require('./input/10-credential-context-combo4-fail.json')));
        await assert.rejects(
          issue(require('./input/11-credential-context-combo5-fail.json')));
      });
      it2('"All libraries or processors MUST ensure that the order of the values in the @context property is what is expected for the specific application."', async function() {
        await issue(require('./input/12-credential-context-order1-ok.json'));
        await assert.rejects(
          issue(require('./input/13-credential-context-order2-fail.json')));
      });
      it2('if present: "The id property MUST express an identifier that others are expected to use when expressing statements about a specific thing identified by that identifier."', async function() {
        await issue(require('./input/14-credential-id-other-ok.json'));
        await assert.rejects(
          issue(require('./input/15-credential-id-nonidentifier-fail.json')));
      });
      it2('if present: "The id property MUST NOT have more than one value."', async function() {
        await issue(require('./input/16-credential-single-id-ok.json'));
        await issue(require('./input/17-credential-subject-single-id-ok.json'));
        await assert.rejects(
          issue(require('./input/18-credential-multi-id-fail.json')));
        await assert.rejects(
          issue(require('./input/19-credential-subject-multi-id-fail.json')));
      });
      it2('if present: "The value of the id property MUST be a URL which MAY be dereferenced."', async function() {
        await assert.rejects(
          issue(require('./input/20-credential-not-url-id-fail.json')));
      });
      it2('"The value of the id property MUST be a single URL."', async function() {
        await assert.rejects(
          issue(require('./input/21-credential-nonsingle-id-fail.json')));
      });
      it2('"Verifiable credentials and verifiable presentations MUST have a type property."', async function() {
        await assert.rejects(
          issue(require('./input/22-credential-no-type-fail.json')));
        await assert.rejects(
          prove(require('./input/23-presentation-no-type-fail.json')));
      });
      it.skip('"The value of the type property MUST be, or map to (through interpretation of the @context property), one or more URLs."', async function() {
      });
      it.skip('type property: "If more than one URL is provided, the URLs MUST be interpreted as an unordered set. "', async function() {
      });
      it.skip('list: "objects that MUST have a type specified."', async function() {
      });
      it.skip('"All credentials, presentations, and encapsulated objects MUST specify, or be associated with, additional more narrow types (like UniversityDegreeCredential, for example) so software systems can process this additional information."', async function() {
      });
      it.skip('"A verifiable credential MUST have a credentialSubject property."', async function() {
      });
      it.skip('"The value of the credentialSubject property is defined as a set of objects that MUST contain one or more claims that are each related to a subject of the verifiable credential."', async function() {
      });
      it.skip('"A verifiable credential MUST have an issuer property."', async function() {
      });
      it.skip('"The value of the issuer property MUST be either a URL or an object containing an id property."', async function() {
      });
      it.skip('"A credential MUST have an validFrom property."', async function() {
      });
      it.skip('"The value of the validFrom property MUST be a string value of an [XMLSCHEMA11-2] combined date-time string representing the date and time the credential becomes valid, which could be a date and time in the future."', async function() {
      });
      it.skip('"If present, the value of the validUntil property MUST be a string value of an [XMLSCHEMA11-2] combined date-time string representing the date and time the credential ceases to be valid, which could be a date and time in the past."', async function() {
      });
      it.skip('"At least one proof mechanism, and the details necessary to evaluate that proof, MUST be expressed for a credential or presentation to be a verifiable credential or verifiable presentation; that is, to be verifiable."', async function() {
      });
      it.skip('"When embedding a proof, the proof property MUST be used."', async function() {
      });
      it.skip('"The specific method used for an embedded proof MUST be included using the type property."', async function() {
      });
      it.skip('"If present, the value of the credentialStatus property MUST include"', async function() {
      });
      it.skip('credentialStatus id property "MUST be a URL which MAY be dereferenced."', async function() {
      });
      it.skip('"If present, the value of the verifiableCredential property MUST be constructed from one or more verifiable credentials, or of data derived from verifiable credentials in a cryptographically verifiable format."', async function() {
      });

      // Advanced
      it.skip('"JSON-based processors MUST process the @context key, ensuring the expected values exist in the expected order for the credential type being processed."', async function() {
      });
      it.skip('"JSON-LD-based processors MUST produce an error when a JSON-LD context redefines any term in the active context."', async function() {
      });
      it.skip('"The value of the credentialSchema property MUST be one or more data schemas that provide verifiers with enough information to determine if the provided data conforms to the provided schema."', async function() {
      });
      it.skip('Each credentialSchema MUST specify its type (for example, JsonSchemaValidator2018), and an id property"', async function() {
      });
      it.skip('credentialSchema id "MUST be a URL identifying the schema file."', async function() {
      });
      it.skip('"The value of the refreshService property MUST be one or more refresh services that provides enough information to the recipient\'s software such that the recipient can refresh the verifiable credential."', async function() {
      });
      it.skip('"Each refreshService value MUST specify its type (for example, ManualRefreshService2018) and its id, which is the URL of the service."', async function() {
      });
      it.skip('"The value of the termsOfUse property MUST specify one or more terms of use policies under which the creator issued the credential or presentation."', async function() {
      });
      it.skip('"Each termsOfUse value MUST specify its type, for example, IssuerPolicy, and MAY specify its instance id."', async function() {
      });
      it.skip('"The value of the evidence property MUST be one or more evidence schemes providing enough information for a verifier to determine whether the evidence gathered by the issuer meets its confidence requirements for relying on the credential."', async function() {
      });
      it.skip('(ZKP) "The verifiable credential MUST contain a Proof, using the proof property, so that the holder can derive a verifiable presentation that reveals only the information than the holder intends to reveal."', async function() {
      });
      it.skip('(ZKP) "If a credential definition is being used, the credential definition MUST be defined in the credentialSchema property, so that it can be used by all parties to perform various cryptographic operations in zero-knowledge."', async function() {
      });
      it.skip('(ZKP?) "Each derived verifiable credential within a verifiable presentation MUST contain all information necessary to verify the verifiable credential, either by including it directly within the credential, or by referencing the necessary information."', async function() {
      });
      it.skip('"A verifiable presentation MUST NOT leak information that would enable the verifier to correlate the holder across multiple verifiable presentations."', async function() {
      });
      // Syntaxes
      it.skip('Data model mapping property values to JSON types (not numeric/boolean/sequence/ordered-set/set/empty): "Other values MUST be represented as a String type."', async function() {
      });
    });
  }
});
