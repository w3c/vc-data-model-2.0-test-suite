import {createServer} from 'http'
import {
  Implementation
} from 'vc-api-test-suite-implementations/lib/Implementation.js';
import receiveJson from './tests/receive-json.js';
const baseContext = 'https://www.w3.org/ns/credentials/v2';
const verifiableCredentialUri = 'https://www.w3.org/2018/credentials#verifiableCredential';
import {createRequire} from 'module';
const require = createRequire(import.meta.url);

// RFC3339 regex
// Z and T can be lowercase
// from vc-test-suite (vcdm1)
const RFC3339regex = new RegExp('^(\\d{4})-(0[1-9]|1[0-2])-' +
  '(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):' +
  '([0-5][0-9]):([0-5][0-9]|60)' +
  '(\\.[0-9]+)?(Z|(\\+|-)([01][0-9]|2[0-3]):' +
  '([0-5][0-9]))$', 'i');

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
    return 'URN is not a URL';
  }
  if(value.indexOf(':') === -1) {
    return 'Missing URL scheme';
  }
  return null;
}

function validateContextValue(value) {
  switch(typeof value) {
  case 'string':
    return validateUrl(value);
  case 'object':
    if(value === null) {
      return 'unexpected null';
    }
    return;
  default:
    return 'unexpected ' + typeof value;
  }
}

const orderSensitiveContext1 = "https://example.org/specific-application/pre";
const orderSensitiveContext2 = "https://example.org/specific-application/post";

function validateContext(context) {
  if(!Array.isArray(context) || context[0] !== baseContext) {
    return 'Expected @context ordered set with v2 base context';
  }
  for(const error of context.slice(1).map(validateContextValue)) {
    if(error) {
      return 'Expected context items to be URLs or context objects: ' + error;
    }
  }
  // Specific application requiring order of values
  const preI = context.indexOf(orderSensitiveContext1);
  if(preI !== -1) {
    const postI = context.indexOf(orderSensitiveContext2);
    if(postI !== -1) {
      if(postI < preI) {
        return 'Expected application-specific order of context values';
      }
    }
  }
  return null;
}

function validateId(id) {
  if(typeof id === 'undefined') {
    return null;
  }
  if(typeof id !== 'string') {
    return 'Expected single id value (URL)';
  }
  return validateUrl(id);
}

function validateProof(proof) {
  if(Array.isArray(proof) && !proof.some(Array.isArray)) {
    // Allow multiple proofs, but protect against recursion.
    return proof.forEach(validateProof);
  }
}

function validateSpecialOrder(contexts) {
  let i1 = contexts.indexOf("https://example.org/ns/test-credential-pre");
  let i2 = contexts.indexOf("https://example.org/ns/test-credential");
  let i3 = contexts.indexOf("https://example.org/ns/test-credential-post");
  if(i1 === -1) {
    i1 = -Infinity;
  }
  if(i3 === -1) {
    i3 = Infinity;
  }
  if(i1 > i2) {
    return 'test-credential-pre should be before test-credential';
  }
  if(i1 > i3) {
    return 'test-credential-pre should be before test-credential-post';
  }
  if(i2 > i3) {
    return 'test-credential should be before test-credential-post';
  }
}

// Contexts and terms should be added here as needed for the tests.
const storedContextMaps = require("./contexts.json");

function lookupInContexts(term, contexts) {
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
    const thisValue = context[term];
    if(thisValue == null) {
      continue;
    }
    if(prot) {
      throw new Error('Redefined when @protected used');
    }
    value = thisValue;
    prot = context['@protected'];
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
    return 'Unmapped type (' + type + ')';
  }
  const error = validateUrl(typeUrl);
  if(error) {
    return 'Expected URL mapped type ('+type+'):' + error;
  }
  if(typeUrl === "https://example.org/examples#ExampleOrderTestVerifiableCredential") {
    // Specific credential type requiring order of context values
    const error = validateSpecialOrder(contexts);
    if(error) {
      return 'Expected special order of context values '
        + 'for ExampleOrderTestVerifiableCredential: ' + error;
    }
  }
  return null;
}

function validateCredentialTypes(types, contexts) {
  if(!Array.isArray(types)) {
    return 'Expected credential type array';
  }
  if(!types.includes('VerifiableCredential')) {
    return 'Expected credential type VerifiableCredential';
  }
  for(const type of types) {
    const error = validateMapTypeURL(type, contexts);
    if(error) {
      return 'Invalid credential type value: ' + error;
    }
  }
  return null;
}

function validateTypes(types, contexts) {
  for(const type of types) {
    const error = validateMapTypeURL(type, contexts);
    if(error) {
      return 'Invalid type: ' + error;
    }
  }
  if(!types.length) {
    return 'Expected type';
  }
  return null;
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
    return credentialSubject.map(validateCredentialSubject)
      .filter(Boolean).join(', ');
  }
  const id = credentialSubject.id;
  if(typeof id !== 'undefined') {
    return validateId(id);
  } else if(isEmpty(credentialSubject)) {
    return 'Expected credentialSubject to have claims';
  }
}

function validateIssuer(issuer) {
  if(typeof issuer === 'string') {
    return validateId(issuer);
  }
  if(typeof issuer !== 'object' || issuer === null) {
    return 'Expected issuer string (id) or object (containing id)';
  }
  if(!issuer.id) {
    return 'Expected id in issuer object';
  }
  return validateId(issuer.id);
}

function validateDateTime(fromUntil) {
  if(typeof fromUntil !== 'string') {
    return 'Expected string date-time';
  }
  if(!RFC3339regex.test(fromUntil)) {
    return 'Expected date-time to match RFC 3339 regular expression';
  }
  return null;
}

function validateCredential(credential) {
  const credentialContext = credential['@context'];
  let error;
  error = validateContext(credentialContext);
  if(error) {
    return 'Invalid context: ' + error;
  }
  error = validateCredentialTypes(credential.type, credentialContext);
  if(error) {
    return 'Invalid credential type: ' + error;
  }
  error = validateId(credential.id);
  if(error) {
    return 'Invalid credential id: ' + error;
  }
  const {
    issuer,
    credentialSubject,
    credentialSchema,
    validFrom,
    validUntil,
    proof,
    credentialStatus,
    refreshService,
    termsOfUse,
    evidence
  } = credential;
  if(!credentialSubject) {
    return 'Expected credentialSubject';
  }
  if(!issuer) {
    return 'Expected credential issuer property';
  }
  error = validateIssuer(issuer);
  if(error) {
    return 'Invalid credential issuer property: ' + error;
  }
  error = validateDateTime(validFrom);
  if(error) {
    return 'Invalid credential validFrom property: ' + error;
  }
  if(validUntil) {
    error = validateDateTime(validUntil);
    if(error) {
      return 'Invalid credential validUntil property: ' + error;
    }
  }
  error = validateCredentialSubject(credentialSubject);
  if(error) {
    return 'Invalid credentialSubject: ' + error;
  }
  if(proof) {
    const proofContext = credentialContext.concat(proof['@context'] || []);
    error = validateTypes(toArray(proof.type), proofContext);
    if(error) {
      return 'Invalid credential proof type: ' + error;
    }
  }
  if(credentialStatus) {
    if(!credentialStatus.id) {
      return 'Expected credentialStatus id';
    }
    error = validateId(credentialStatus.id);
    if(error) {
      return 'Invalid credential status id: ' + error;
    }
    const statusContext = credentialContext.concat(
      credentialStatus['@context'] || []);
    error = validateTypes(toArray(credentialStatus.type), statusContext);
    if(error) {
      return 'Invalid credentialStatus type: ' + error;
    }
  }
  if(termsOfUse) {
    const termsOfUseContext = credentialContext.concat(termsOfUse['@context'] || []);
    error = validateTypes(toArray(termsOfUse.type), termsOfUseContext);
    if(error) {
      return 'Invalid termsOfUse type: ' + error;
    }
  }
  if(evidence) {
    const evidenceContext = credentialContext.concat(evidence['@context'] || []);
    error = validateTypes(toArray(evidence.type), evidenceContext);
    if(error) {
      return 'Invalid evidence type: ' + error;
    }
  }
  if(credentialSchema) {
    const schemas = toArray(credentialSchema);
    for(const schema of schemas) {
      error = validateSchema(schema, credential);
      if(error) {
        return 'Unable to validate credential schema: ' + error;
      }
    }
  }
  if(refreshService) {
    const services = toArray(refreshService);
    for(const service of services) {
      error = validateRefreshService(service, credential);
      if(error) {
        return 'Unable to validate credential refresh service: ' + error;
      }
    }
  }
  return null;
}

function validateSchema(schema, credential) {
  const credentialContext = credential['@context'];
  const schemaContext = credentialContext.concat(schema['@context'] || []);
  const schemaTypes = toArray(schema.type);
  if(schemaTypes.length === 0) {
    return 'Missing type';
  }
  if(typeof schema.id === 'undefined') {
    return 'Missing id';
  }
  let error = validateId(schema.id);
  if(error) {
    return 'Invalid id: ' + error;
  }
  error = validateTypes(schemaTypes, schemaContext);
  if(error) {
    return 'Invalid schema type: ' + error;
  }
}

function validateRefreshService(service, credential) {
  const credentialContext = credential['@context'];
  const serviceContext = credentialContext.concat(service['@context'] || []);
  const serviceTypes = toArray(service.type);
  if(serviceTypes.length === 0) {
    return 'Missing type';
  }
  if(typeof service.id === 'undefined') {
    return 'Missing id';
  }
  let error = validateId(service.id);
  if(error) {
    return 'Invalid id: ' + error;
  }
  error = validateTypes(serviceTypes, serviceContext);
  if(error) {
    return 'Invalid service type: ' + error;
  }
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
  const error = validateCredential(credential);
  if(error) {
    throw 'Invalid credential: ' + error;
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
  if(!vc) {
    errors.push('Expected verifiableCredential property');
  } else {
    const error = validateCredential(vc);
    if(error) {
      errors.push(error);
    }
  }
  const result = {
    checks,
    warnings,
    errors
  };
  res.statusCode = errors.length ? 400 : 200;
  serveJson(res, result);
}

function parseJWT(jwt) {
  const [headerB64, payloadB64, sigB64] = jwt.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64'));
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64'));
  const signature = Buffer.from(sigB64, 'base64');
  return {header, payload, signature};
}

function validateVCJWT(jwt) {
  let jwtParts;
  try {
    jwtParts = parseJWT(jwt);
  } catch(e) {
    return 'Unable to parse VC JWT: ' + e.message;
  }
  const {header, payload, signature} = jwtParts;
  const {typ, alg, kid} = header;
  // VCDM2 refers to https://w3c.github.io/vc-jwt/ for use of these properties.
  // This example implementation doesn't yet check them but only validates vc.
  const {exp, iss, nbf, jti, sub, vc} = payload;
  const error = validateCredential(vc);
  if(error) {
    return 'Unable to validate credential in JWT: ' + error;
  }
  return null;
}

function validateVerifiableCredentialString(vc) {
  if(vc.startsWith('eyJhb')) {
    const error = validateVCJWT(vc);
    if(error) {
      return 'Unable to validate VC JWT: ' + error;
    }
    return null;
  }
  return 'Expected JWT for string verifiableCredential value';
}

function validateVpVerifiableCredentialValue(vc) {
  switch(typeof vc) {
    case 'object':
      if(vc === null) {
        return 'unexpected null';
      }
      return validateCredential(vc);
    case 'string':
      return validateVerifiableCredentialString(vc);
    default:
      return 'unexpected type';
  }
  return null;
}

function validateVpVerifiableCredentials(presentation) {
  const vcs = toArray(presentation[verifiableCredentialUri])
    .concat(toArray(presentation.verifiableCredential));
  for(const vc of vcs) {
    const error = validateVpVerifiableCredentialValue(vc);
    if(error) {
      return 'Invalid verifiable credential: ' + error;
    }
  }
  return null;
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
  let error;
  error = validateContext(presentation['@context']);
  if(error) {
    throw 'Invalid presentation context: ' + error;
  }
  error = validateId(presentation.id);
  if(error) {
    throw 'Invalid presentation id: ' + error;
  }
  error = validateVpVerifiableCredentials(presentation);
  if(error) {
    throw error;
  }
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
    let error;
    error = validateContext(vp['@context']);
    if(error) {
      throw 'Invalid verifiable presentation context: ' + error;
    }
    error = validateId(vp.id);
    if(error) {
      throw 'Invalid verifiable presentation id: ' + error;
    }
    if(!vp.proof) {
      throw 'Missing verifiable presentation proof';
    }
    error = validateVpVerifiableCredentials(vp);
    if(error) {
      throw 'Invalid verifiable credential in presentation: ' + error;
    }
  } catch(e) {
    errors.push(e.message || e);
  }
  const result = {
    checks,
    warnings,
    errors
  };
  res.statusCode = errors.length ? 400 : 200;
  serveJson(res, result);
}
