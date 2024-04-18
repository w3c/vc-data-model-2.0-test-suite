/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import chai from 'chai';

const should = chai.should();

export function shouldThrowInvalidInput({result, error}) {
  should.not.exist(result, 'Expected no result from issuer.');
  should.exist(error, 'Expected issuer to Error.');
  should.exist(error.status, 'Expected an HTTP error response code.');
  error.status.should.not.equal(401,
    'Should not get an Authorization Error.');
  error.status.should.equal(400,
    'Expected status code 400 invalid input!');
}

export function shouldReturnResult({result, error}) {
  should.not.exist(error, `Expected no error, got ${error?.message}`);
  should.exist(result, 'Expected a result');
}

export function shouldBeIssuedVc({issuedVc}) {
  issuedVc.should.be.an(
    'object',
    'Expected the issued Verifiable Credential to be an object.'
  );
  issuedVc.should.have.property('@context');
  issuedVc.should.have.property('type');
  issuedVc.type.should.contain(
    'VerifiableCredential',
    'Expected `type` to contain "VerifiableCredential".'
  );
  issuedVc.should.have.property('id');
  issuedVc.id.should.be.a(
    'string',
    'Expected `id` to be a string.'
  );
  issuedVc.should.have.property('credentialSubject');
  _shouldBeValidCredentialSubject(
    {credentialSubject: issuedVc.credentialSubject});
  issuedVc.should.have.property('issuer');
  const issuerType = typeof(issuedVc.issuer);
  issuerType.should.be.oneOf(
    ['string', 'object'],
    'Expected `issuer` to be a string or an object.'
  );
  issuedVc.should.have.property('proof');
  issuedVc.proof.should.be.an(
    'object',
    'Expected `proof` to be an object.'
  );
  if(issuerType === 'object') {
    should.exist(issuedVc.issuer.id,
      'Expected issuer object to have property id');
  }
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
