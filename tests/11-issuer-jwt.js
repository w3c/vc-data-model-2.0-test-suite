/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {shouldBeIssuedVc, shouldThrowInvalidInput} from './assertions.js';
import chai from 'chai';
import {createRequestBody} from './mock.data.js';
import {filterByTag} from 'vc-api-test-suite-implementations';

const should = chai.should();

const {match, nonMatch} = filterByTag({property: 'issuers', tags: ['JWT']});

describe('Issue Credential - JWT', function() {
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
    const issuer = implementation.issuers.find(issuer =>
      issuer.tags.has('vc-api') && issuer.tags.has('JWT'));
    describe(name, function() {
      it('MUST successfully issue a credential.', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        const {result, data: issuedVc, error} = await issuer.post({json: body});
        should.exist(result, 'Expected result from issuer.');
        should.exist(issuedVc, 'Expected result to have data.');
        should.not.exist(error, 'Expected issuer to not Error.');
        result.status.should.equal(201, 'Expected statusCode 201.');
        shouldBeIssuedVc({issuedVc});
      });
      it('Request body MUST have property "credential".', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        body.verifiableCredential = {...body.credential};
        delete body.credential;
        const {result, error} = await issuer.post({json: body});
        shouldThrowInvalidInput({result, error});
      });
      it('credential MUST have property "@context".', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        delete body.credential['@context'];
        const {result, error} = await issuer.post({json: body});
        shouldThrowInvalidInput({result, error});
      });
      it('credential "@context" MUST be an array.', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        body.credential['@context'] = 4;
        const {result, error} = await issuer.post({json: body});
        shouldThrowInvalidInput({result, error});
      });
      it('credential "@context" items MUST be strings.', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        const invalidContextTypes = [{foo: true}, 4, false, null];
        for(const invalidContextType of invalidContextTypes) {
          body.credential['@context'] = invalidContextType;
          const {result, error} = await issuer.post({json: {...body}});
          shouldThrowInvalidInput({result, error});
        }
      });
      it('credential MUST have property "type"', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        delete body.credential.type;
        const {result, error} = await issuer.post({json: body});
        shouldThrowInvalidInput({result, error});
      });
      it('"credential.type" MUST be an array.', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        body.credential.type = 4;
        const {result, error} = await issuer.post({json: body});
        shouldThrowInvalidInput({result, error});
      });
      it('"credential.type" items MUST be strings', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        const invalidCredentialTypes = [null, true, 4, []];
        for(const invalidCredentialType of invalidCredentialTypes) {
          body.credential.type = invalidCredentialType;
          const {result, error} = await issuer.post({json: {...body}});
          shouldThrowInvalidInput({result, error});
        }
      });
      it('credential MUST have property "issuer"', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        delete body.credential.issuer;
        const {result, error} = await issuer.post({json: body});
        shouldThrowInvalidInput({result, error});
      });
      it('"credential.issuer" MUST be a string or an object', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        const invalidIssuerTypes = [null, true, 4, []];
        for(const invalidIssuerType of invalidIssuerTypes) {
          body.credential.issuer = invalidIssuerType;
          const {result, error} = await issuer.post({json: {...body}});
          shouldThrowInvalidInput({result, error});
        }
      });
      it('credential MUST have property "credentialSubject"', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        delete body.credential.credentialSubject;
        const {result, error} = await issuer.post({json: body});
        shouldThrowInvalidInput({result, error});
      });
      it('"credential.credentialSubject" MUST be an object', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        const invalidCredentialSubjectTypes = [null, true, 4, []];
        for(const invalidCredentialSubjectType of
          invalidCredentialSubjectTypes) {
          body.credential.credentialSubject = invalidCredentialSubjectType;
          const {result, error} = await issuer.post({json: {...body}});
          shouldThrowInvalidInput({result, error});
        }
      });
      it('credential MAY have property "issuanceDate"', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        body.credential.issuanceDate = new Date().toISOString()
          .replace('.000Z', 'Z');
        const {result, error} = await issuer.post({json: body});
        should.exist(result, 'Expected result from issuer.');
        should.not.exist(error, 'Expected issuer to not Error.');
        result.status.should.equal(201, 'Expected statusCode 201.');
      });
      it('credential MAY have property "expirationDate"', async function() {
        this.test.cell = {
          columnId: name,
          rowId: this.test.title
        };
        const body = createRequestBody({issuer});
        // expires in a year
        const oneYear = Date.now() + 365 * 24 * 60 * 60 * 1000;
        body.credential.expirationDate = new Date(oneYear).toISOString()
          .replace('.000Z', 'Z');
        const {result, error} = await issuer.post({json: body});
        should.exist(result, 'Expected result from issuer.');
        should.not.exist(error, 'Expected issuer to not Error.');
        result.status.should.equal(201, 'Expected statusCode 201.');
      });
    });
  }
});
