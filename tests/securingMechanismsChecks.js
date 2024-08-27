// This section doesn't contain MUST statements but the
// conformance section requires at least 1
// Securing Mechanism to be invluded in the VC/VP

// This file contains re-usable functions to test
// various Securing Mechanism related features.

// Most of these are imported by the conformance section

export function isSecured(name, issuedVc) {
  if(issuedVc.contains('proof')) {
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
