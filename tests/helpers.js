import assert from 'node:assert/strict';
import {createRequire} from 'module';
import {createTimeStamp} from './data-generator.js';
import {shouldRejectEitherIssueOrVerify} from './assertions.js';

const require = createRequire(import.meta.url);

export function setupMatrix(match) {
  // this will tell the report
  // to make an interop matrix with this suite
  this.matrix = true;
  this.report = true;
  this.implemented = [...match.keys()];
  this.rowLabel = 'Test Name';
  this.columnLabel = 'Implementer';
}
export function addPerTestMetadata() {
  // append test meta data to the it/test this.
  this.currentTest.cell = {
    columnId: this.currentTest.parent.title,
    rowId: this.currentTest.title
  };
}
export function trimText(string) {
  // helper function to trim long text on newlines and double spaces
  return string.replace(/\s+/g, ' ').trim();
}
export async function validityPeriodCheck(endpoints) {
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

// These are Securing Mechanisms related functions
// Most of these are imported by the conformance section
export function isSecured(name, issuedVc) {
  if('proof' in issuedVc) {
    embeddedProofCheck(name, issuedVc);
  } else {
    envelopedProofCheck(issuedVc);
  }
}

export function embeddedProofCheck(name, issuedVc) {
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

export function envelopedProofCheck(name, issuedVc) {
  issuedVc.should.have.property('type').that.does
    .include('EnveloppedVerifiableCredential',
      `Expected ${name} to issue a VC.`);
  // TODO: add more enveloped proof test
}

export function extractEnveloppedCredential(name, issuedVc) {
  issuedVc.should.have.property('id').that.does
    .include('data:application/vc+jwt', `Expected ${name} to issue a VC.`);
  const vcId = issuedVc.id;
  const jwt = vcId.split(',')[-1];
  const payload = jwt.split('.')[1];
  const credential = atob(payload);
  return credential;
}

export function includesAllRequiredProperties(issuedVc) {
  issuedVc.should.have.property('@context');
  issuedVc.should.have.property('type');
  issuedVc.should.have.property('issuer');
  if(issuedVc.type === 'EnveloppedVerifiableCredential' ||
     'EnveloppedVerifiableCredential' in issuedVc.type) {
    issuedVc.should.have.property('id', `Missing id`);
    const extractedCredential = extractEnveloppedCredential(issuedVc);
    extractedCredential.should.have.property('@context', `Missing context`);
    extractedCredential.should.have.property('type', `Missing type`);
    extractedCredential.should.have.property('issuer', `Missing issuer`);
    extractedCredential.should.have.property('credentialSubject',
      `Missing credentialSubject`);
  } else {
    issuedVc.should.have.property('proof');
    issuedVc.should.have.property('credentialSubject');
  }
}

