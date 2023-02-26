import {createServer} from 'http'
import {
  Implementation
} from 'vc-api-test-suite-implementations/lib/Implementation.js';
import receiveJson from './tests/receive-json.js';
const baseContext = 'https://www.w3.org/ns/credentials/v2';

export default async function doServer() {
  const {url, server} = await new Promise((resolve, reject) => {
    createServer(handleReq)
      .on('error', reject)
      .listen(0, '127.0.0.1', onListening);
    function onListening() {
      const {address, port} = this.address();
      const url = 'http://' + address + ':' + port;
      resolve({url, server: this});
    }
  });
  const name = 'example';
  const implementation = new Implementation({
    issuers: [{
      id: 'did:example:issuer',
      endpoint: url + '/credentials/issue',
      tags: ['vc-api', 'vcdm2'],
    }],
    verifiers: [{
      id: '',
      endpoint: url + '/credentials/verify',
      tags: ['vc-api', 'vcdm2'],
    }],
    provers: [{
      id: 'did:example:prover',
      endpoint: url + '/presentations/prove',
      tags: ['vc-api', 'vcdm2'],
    }],
    vpVerifiers: [{
      id: '',
      endpoint: url + '/presentations/verify',
      tags: ['vc-api', 'vcdm2'],
    }]
  });
  return {name, implementation, stop: server.close.bind(server)};
}

async function handleReq(req, res) {
  try {
    if(req.url === '/credentials/issue') {
      return await handleIssue(req, res);
    }
    if(req.url === '/credentials/verify') {
      return await handleVerify(req, res);
    }
    if(req.url === '/presentations/prove') {
      return await handleProve(req, res);
    }
    if(req.url === '/presentations/verify') {
      return await handleVerifyVp(req, res);
    }
    res.statusCode = 404;
    return serveJson(res, 'Not Found');
  } catch(e) {
    if(res.statusCode === 200) {
      res.statusCode = 500;
    }
    // Note: stack includes filenames (paths)
    serveJson(res, e.stack || e);
  }
}

function serveJson(res, obj) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function concatProof(existingProof, newProof) {
  if(!existingProof) {
    return newProof;
  }
  if(Array.isArray(existingProof)) {
    return existingProof.concat(newProof);
  }
  return [existingProof, newProof];
}

function validateUrl(value) {
  if(value.startsWith('urn:')) {
    throw 'URN is not a URL';
  }
  if(value.indexOf(':') === -1) {
    throw 'Missing URL scheme';
  }
}

function validateContextValue(value) {
  switch(typeof value) {
  case 'string':
    return validateUrl(value);
  case 'object':
    if(value === null) {
      throw 'unexpected null';
    }
    return;
  default:
    throw 'unexpected ' + typeof value;
  }
}

const orderSensitiveContext1 = "https://example.org/specific-application/pre";
const orderSensitiveContext2 = "https://example.org/specific-application/post";

function validateContext(context) {
  if(!Array.isArray(context) || context[0] !== baseContext) {
    throw 'Expected @context ordered set with v2 base context';
  }
  try {
    context.slice(1).forEach(validateContextValue);
  } catch(e) {
    throw 'Expected context items to be URLs or context objects: ' + e;
  }
  // Specific application requiring order of values
  const preI = context.indexOf(orderSensitiveContext1);
  if(preI !== -1) {
    const postI = context.indexOf(orderSensitiveContext2);
    if(postI !== -1) {
      if(postI < preI) {
        throw 'Expected application-specific order of context values';
      }
    }
  }
}

function validateId(id) {
  if(typeof id === 'undefined') {
    return;
  }
  if(typeof id !== 'string') {
    throw 'Expected single id value (URL)';
  }
  try {
    Array.isArray(id) ? id.map(validateUrl) : validateUrl(id);
  } catch(e) {
    throw 'Invalid ID: ' + (e.message || e);
  }
}

function validateProof(proof) {
  if(Array.isArray(proof) && !proof.some(Array.isArray)) {
    // Allow multiple proofs, but protect against recursion.
    return proof.forEach(validateProof);
  }
}

// Contexts and terms should be added here as needed for the tests.
const storedContextMaps = {
  "https://www.w3.org/ns/credentials/v2": {
  },
  "https://www.w3.org/ns/credentials/examples/v2": {
    "RelationshipCredential": "https://example.org/examples#RelationshipCredential"
  }
};

function lookupInContexts(type, contexts) {
  let value = null;
  let prot = false;
  for(let context of contexts) {
    if(typeof context === 'string') {
      const mappedContext = storedContextMaps[context];
      if(!mappedContext) {
        throw new Error('Unknown context: ' + context);
      }
      context = mappedContext;
    }
    const thisValue = context[type];
    if(thisValue === null) {
      continue;
    }
    value = thisValue;
  }
  return value;
}

function validateMapTypeURL(type, contexts) {
  if(type.includes(':')) {
    // Assume type is supposed to be a URL.
    // Note that this doesn't correctly handle short prefixes (JSON-LD)
    // such as "ex:" used in the examples context.
    return validateUrl(type);
  }
  const typeUrl = lookupInContexts(type, contexts);
  if(!typeUrl) {
    throw new Error('Unmapped type (' + type + ')');
  }
  try {
    validateUrl(typeUrl);
  } catch(e) {
    throw 'Expected URL mapped type ('+type+'):' + (e.message || e);
  }
  return typeUrl;
}

function validateCredentialTypes(types, contexts) {
  if(!Array.isArray(types)) {
    throw 'Expected credential type array';
  }
  if(!types.includes('VerifiableCredential')) {
    throw 'Expected credential type VerifiableCredential';
  }
  for(const type of types) {
    if(type === 'VerifiableCredential') {
      continue;
    }
    validateMapTypeURL(type, contexts);
  }
}

function validateTypes(types, contexts) {
  for(const type of types) {
    validateMapTypeURL(type, contexts);
  }
  if(!types.length) {
    throw new Error('Expected type');
  }
}

function toArray(value) {
  return Array.isArray(value) ? value :
    typeof value === 'undefined' ? [] : [value];
}

function isEmpty(object) {
  for(const key in object) {
    return false;
  }
  return true;
}

function validateCredentialSubject(credentialSubject) {
  if(Array.isArray(credentialSubject) && !credentialSubject.some(Array.isArray)) {
    return credentialSubject.forEach(validateCredentialSubject);
  }
  const id = credentialSubject.id;
  if(typeof id !== 'undefined') {
    validateId(id);
  } else if(isEmpty(credentialSubject)) {
    throw new Error('Expected credentialSubject to have claims');
  }
}

function validateIssuer(issuer) {
  if(typeof issuer === 'string') {
    return validateId(issuer);
  }
  if(typeof issuer !== 'object' || issuer === null) {
    throw new Error('Expected issuer string (id) or object (containing id)');
  }
  if(!issuer.id) {
    throw new Error('Expected id in issuer object');
  }
  return validateId(issuer.id);
}

async function handleIssue(req, res) {
  if(req.method !== 'POST') {
    res.statusCode = 405;
    throw 'Expected POST';
  }
  const obj = await receiveJson(req);
  const {credential} = obj;
  res.statusCode = 400;
  if(!credential) {
    throw 'Expected credential property';
  }
  const credentialContext = credential['@context'];
  validateContext(credentialContext);
  validateCredentialTypes(credential.type, credentialContext);
  validateId(credential.id);
  const {
    issuer,
    credentialSubject,
    proof,
    credentialStatus,
    termsOfUse,
    evidence
  } = credential;
  if(!credentialSubject) {
    throw new Error('Expected credentialSubject');
  }
  if(!issuer) {
    throw new Error('Expected issuer property');
  }
  validateIssuer(issuer);
  validateCredentialSubject(credentialSubject);
  if(proof) {
    const proofContext = credentialContext.concat(proof['@context'] || []);
    validateTypes(toArray(proof.type), proofContext);
  }
  if(credentialStatus) {
    const statusContext = credentialContext.concat(
      credentialStatus['@context'] || []);
    validateTypes(toArray(credentialStatus.type), statusContext);
  }
  if(termsOfUse) {
    const termsOfUseContext = credentialContext.concat(termsOfUse['@context'] || []);
    validateTypes(toArray(termsOfUse.type), termsOfUseContext);
  }
  if(evidence) {
    const evidenceContext = credentialContext.concat(evidence['@context'] || []);
    validateTypes(toArray(evidence.type), evidenceContext);
  }
  let vc = {};
  for(const key in credential) {
    if(key === 'proof') {
      continue;
    }
    vc[key] = credential[key];
  }
  vc.proof = concatProof(credential.proof, {
    type: 'https://example.org/#ExampleTestSuiteProof'
  });
  res.statusCode = 200;
  serveJson(res, vc);
}

async function handleVerify(req, res) {
  if(req.method !== 'POST') {
    res.statusCode = 405;
    throw 'Expected POST';
  }
  let checks = [];
  let warnings = [];
  let errors = [];
  const obj = await receiveJson(req);
  const {verifiableCredential: vc} = obj;
  try {
    if(!vc) {
      throw 'Expected verifiableCredential property';
    }
    if(!Array.isArray(vc.type)) {
      throw 'Expected verifiableCredential type array';
    }
    if(!vc.type.includes('VerifiableCredential')) {
      throw 'Expected type VerifiableCredential';
    }
    validateContext(vc['@context']);
    validateId(vc.id);
    const {credentialSubject} = credential;
    if(credentialSubject) {
      validateId(credentialSubject.id);
    }
  } catch(e) {
    errors.push(e);
  }
  const result = {
    checks,
    warnings,
    errors
  };
  res.statusCode = errors.length ? 400 : 200;
  serveJson(res, result);
}

async function handleProve(req, res) {
  if(req.method !== 'POST') {
    res.statusCode = 405;
    throw 'Expected POST';
  }
  const obj = await receiveJson(req);
  const {presentation} = obj;
  res.statusCode = 400;
  if(!presentation) {
    throw 'Expected presentation property';
  }
  if(!Array.isArray(presentation.type)) {
    throw 'Expected presentation type array';
  }
  if(!presentation.type.includes('VerifiablePresentation')) {
    throw 'Expected presentation type VerifiablePresentation';
  }
  validateContext(presentation['@context']);
  validateId(presentation.id);
  let vp = {};
  for(const key in presentation) {
    if(key === 'proof') {
      continue;
    }
    vp[key] = presentation[key];
  }
  vp.proof = concatProof(presentation.proof, {
    type: 'https://example.org/#ExampleTestSuiteProof'
  });
  res.statusCode = 200;
  serveJson(res, vp);
}

async function handleVerifyVp(req, res) {
  if(req.method !== 'POST') {
    res.statusCode = 405;
    throw 'Expected POST';
  }
  let checks = [];
  let warnings = [];
  let errors = [];
  const obj = await receiveJson(req);
  const {verifiablePresentation: vp} = obj;
  try {
    if(!vp) {
      throw 'Expected verifiablePresentation property';
    }
    validateContext(vp['@context']);
    validateId(vp.id);
  } catch(e) {
    errors.push(e);
  }
  const result = {
    checks,
    warnings,
    errors
  };
  res.statusCode = errors.length ? 400 : 200;
  serveJson(res, result);
}
