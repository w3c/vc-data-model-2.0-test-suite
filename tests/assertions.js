/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */
import assert from 'node:assert/strict';
import chai from 'chai';
import {createRequire} from 'module';
import {createTimeStamp} from './data-generator.js';
import {extractIfEnveloped} from './helpers.js';
import {TestEndpoints} from './TestEndpoints.js';

const should = chai.should();

const require = createRequire(import.meta.url);

export function shouldThrowInvalidInput({result, error}) {
  should.not.exist(result, 'Expected no result from issuer.');
  should.exist(error, 'Expected issuer to Error.');
  should.exist(error.status, 'Expected an HTTP error response code.');
  error.status.should.not.equal(401,
    'Should not get an Authorization Error.');
  error.status.should.be.oneOf([400, 422],
    'Expected status code 400 (invalid input) or 422 (unprocessable entity).');
}

export function shouldReturnResult({result, error}) {
  should.not.exist(error, `Expected no error, got ${error?.message}`);
  should.exist(result, 'Expected a result');
}

export function shouldBeCredential(credential) {
  credential.should.be.an(
    'object',
    'Expected the issued Verifiable Credential to be an object.'
  );
  credential.should.have.property('@context');
  credential.should.have.property('type');
  credential.type.should.contain(
    'VerifiableCredential',
    'Expected `type` to contain "VerifiableCredential".'
  );
  credential.should.have.property('credentialSubject');
  _shouldBeValidCredentialSubject(
    {credentialSubject: credential.credentialSubject});
  credential.should.have.property('issuer');
  const issuerType = typeof(credential.issuer);
  issuerType.should.be.oneOf(
    ['string', 'object'],
    'Expected `issuer` to be a string or an object.'
  );
  if(issuerType === 'object') {
    should.exist(credential.issuer.id,
      'Expected issuer object to have property id');
  }
}

export function shouldBeIssuedVc({issuedVc}) {
  shouldBeCredential(issuedVc);
  issuedVc.should.have.property('proof');
  issuedVc.proof.should.be.an(
    'object',
    'Expected `proof` to be an object.'
  );
}

/**
 * Some issuers validate credentials before issuing and others don't.
 * This asserts that a negative case is rejected at either issuance
 * or verification.
 *
 * @param {object} options - Options to use.
 * @param {object}options.endpoints - An implementer's endpoints.
 * @param {object} options.negativeTest - An invalid credential for issuance.
 * @param {string} options.reason - The reason the negativeTest should fail.
 *
 * @returns {Promise<{error, result}>} Returns the result and error.
 *
 */
export async function shouldRejectEitherIssueOrVerify({
  endpoints,
  negativeTest,
  reason
}) {
  let error;
  let result;
  try {
    //depending on the issuer this may fail to issue an invalid VC
    result = await endpoints.issue(negativeTest);
  } catch(e) {
    error = e;
  }
  // if an issuer fails to issue a VC with invalid validFrom
  // and/or validUntil we count this as a success and return early
  if(error) {
    return {error, result};
  }
  // if an issuer does not validate validFrom and/or validUntil
  // expect the verifier to reject invalid validFrom and/or
  // validUntil values
  await assert.rejects(endpoints.verify(result), reason);
  return {error, result};
}

/**
 * Test various values of `validFrom` and `validUntil`.
 *
 * @param {TestEndpoints} endpoints - Endpoints collection to test against.
 */
export async function testTemporality(endpoints) {
  const positiveTest = require(
    './input/credential-validUntil-validFrom-ok.json');
  positiveTest.validFrom = createTimeStamp({skewYears: -1});
  positiveTest.validUntil = createTimeStamp({skewYears: 1});
  await assert.doesNotReject(endpoints.issue(positiveTest),
    'Failed to accept a VC with a `validUntil` after its `validFrom`.');
  const negativeTest = require(
    './input/credential-validUntil-validFrom-fail.json');
  negativeTest.validFrom = createTimeStamp({skewYears: 1});
  negativeTest.validUntil = createTimeStamp({skewYears: -1});
  await shouldRejectEitherIssueOrVerify({
    endpoints,
    negativeTest,
    reason: 'Failed to reject a VC with a `validUntil` before its ' +
      '`validFrom`.`'
  });
}

function _shouldBeValidCredentialSubject({credentialSubject}) {
  // credentialSubject should not be null or undefined
  should.exist(credentialSubject, 'Expected credentialSubject to exist.');
  // if only one claim is being made just check it
  if(!Array.isArray(credentialSubject)) {
    return _shouldHaveClaims({subject: credentialSubject});
  }
  // a credentialSubject can be an Array of objects
  credentialSubject.length.should.be.gt(
    0,
    'Expected credentialSubject to make a claim on at least one subject.'
  );
  for(const subject of credentialSubject) {
    _shouldHaveClaims({subject});
  }
}

function _shouldHaveClaims({subject}) {
  subject.should.be.an(
    'object',
    'Expected credentialSubject to be an object.'
  );
  Object.keys(subject).length.should.be.gt(
    0,
    'Expected credentialSubject to have at least one claim.'
  );
}

export function shouldBeSecured(name, issuedVc) {
  if('proof' in issuedVc) {
    shouldHaveEmbeddedProof(name, issuedVc);
  } else {
    shouldHaveEnvelopedProof(name, issuedVc);
  }
}

export function shouldHaveEmbeddedProof(name, issuedVc) {
  issuedVc.should.have.property('type').that.does
    .include('VerifiableCredential', `Expected ${name} to issue a VC.`);
  issuedVc.should.have.property('proof').which.is.not.a('string',
    'Expected VC to have a `proof`.');
  if(Array.isArray(issuedVc.proof)) {
    issuedVc.proof.length.should.be.gt(0,
      'Expected at least one `proof`.');
    issuedVc.proof.every(p => typeof p === 'object').should.be.true;
  } else {
    issuedVc.proof.should.be.an(
      'object',
      'Expected `proof` to be an object.'
    );
  }
}

export function shouldHaveEnvelopedProof(name, issuedVc) {
  issuedVc.should.have.property('type').that.does
    .include('EnvelopedVerifiableCredential',
      `Expected ${name} to issue a VC.`);
  issuedVc.should.have.property('id').that.does
    .include('data:');
  const credential = extractIfEnveloped(issuedVc);
  credential.should.exist();
}

export function checkRequiredProperties(name, issuedVc) {
  issuedVc.should.have.property('@context');
  issuedVc.should.have.property('type');
  if(issuedVc.type == 'EnvelopedVerifiableCredential' ||
     'EnvelopedVerifiableCredential' in issuedVc.type) {
    issuedVc.should.have.property('id');
    const extractedCredential = extractIfEnveloped(issuedVc);
    extractedCredential.should.have.property('@context');
    extractedCredential.should.have.property('type');
    extractedCredential.should.have.property('issuer');
    extractedCredential.should.have.property('credentialSubject');
  } else {
    issuedVc.should.have.property('issuer');
    issuedVc.should.have.property('credentialSubject');
    issuedVc.should.have.property('proof');
  }
}

export async function injectOrReject(endpoints, inputFile) {
  // we do a try catch to allow implementation supporting
  // context injection to still pass this test
  try {
    const vc = await endpoints.issue(require(inputFile));
    vc.should.have.property('@context').to.be.an('array',
      'Failed to respond with a VC with injected `@context`.');
    assert.strictEqual(vc['@context'][0],
      'https://www.w3.org/ns/credentials/v2',
      'Failed to keep `@context` order intact.'
    );
  } catch(err) {
    await assert.rejects(endpoints.issue(require(inputFile)),
      {name: 'HTTPError'},
      'Failed to reject a VC without a missing or incomplete `@context`.');
  }
}
