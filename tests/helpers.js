import {challenge} from './fixtures.js';
import {makeZcapRequest} from './zcapHandler.js';

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

export function extractIfEnveloped(input) {
  if(input.type == 'EnvelopedVerifiableCredential' ||
    'EnvelopedVerifiableCredential' in input.type
  ) {
    input.should.have.property('id').that.does
      .include('data:', `Missing id field.`);
    let extractedCredential = atob(input.id.split(',')[1].split('.')[1]);
    extractedCredential = JSON.parse(extractedCredential);
    return extractedCredential?.vc || extractedCredential;
  } else if(input.type == 'EnvelopedVerifiablePresentation' ||
    'EnvelopedVerifiablePresentation' in input.type
  ) {
    input.should.have.property('id').that.does
      .include('data:', `Missing id field.`);
    let extractedPresentation = atob(input.id.split(',')[1].split('.')[1]);
    extractedPresentation = JSON.parse(extractedPresentation);
    return extractedPresentation?.vp || extractedPresentation;
  } else {
    return input;
  }
}

export const secureCredential = async ({
  issuer,
  credential,
}) => {
  const {settings: {id: issuerId, options = {}}} = issuer;
  credential.issuer = issuerId;
  const body = {credential, options};
  if(issuer.settings.zcap) {
    const response = await makeZcapRequest(issuer.settings, body);
    return response?.data?.verifiableCredential;
  } else {
    const {data, result, error} = await issuer.post({json: body});
    if(!result || !result.ok) {
      error;
      return null;
    }
    return data;
  }
};

export const verifyCredential = async ({
  verifier,
  verifiableCredential,
}) => {
  const {settings: {options = {}}} = verifier;
  const body = {verifiableCredential, options};
  if(verifier.settings.zcap) {
    const response = await makeZcapRequest(verifier.settings, body);
    return response?.data;
  } else {
    const {data, result, error} = await verifier.post({json: body});
    if(!result || !result.ok) {
      error;
      return null;
    }
    return data;
  }
};

export const verifyPresentation = async ({
  vpVerifier,
  verifiablePresentation,
}) => {
  const {settings: {options = {}}} = vpVerifier;
  options.challenge = challenge;
  const body = {verifiablePresentation, options};
  if(vpVerifier.settings.zcap) {
    const response = await makeZcapRequest(vpVerifier.settings, body);
    return response?.data;
  } else {
    const {data, result, error} = await vpVerifier.post({json: body});
    if(!result || !result.ok) {
      error;
      return null;
    }
    return data;
  }
};

export function generateCredential({
  context = ['https://www.w3.org/ns/credentials/v2'],
  type = ['VerifiableCredential'],
  credentialSubject = {
    id: 'did:example:alice',
    name: 'Alice'
  }
} = {}) {
  const credential = {
    '@context': context,
    type,
    credentialSubject
  };
  return credential;
}

export function generateEnvelope({
  context = 'https://www.w3.org/ns/credentials/v2',
  type,
  id
} = {}) {
  const envelopeCredential = {
    '@context': context,
    type,
    id
  };
  return envelopeCredential;
}

export const secureEnvelope = async ({
}) => {};
