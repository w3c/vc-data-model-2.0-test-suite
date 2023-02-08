import {createServer} from 'http'
import {promisify} from 'util'
import {Implementation} from 'vc-api-test-suite-implementations/lib/Implementation.js';
const baseContext = 'https://www.w3.org/ns/credentials/v2';

export default async function doServer() {
  const {url, server} = await new Promise((resolve, reject) => {
    createServer(handleReq).on('error', reject).listen(0, '127.0.0.1', function () {
      const addr = this.address()
      const host = addr.family === 'IPv6' ? '[' + addr.address + ']' : addr.address
      const url = 'http://' + host + ':' + addr.port;
     resolve({url, server: this})
    })
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
    if (req.url === '/credentials/issue') {
      await handleIssue(req, res);
    } else if (req.url === '/credentials/verify') {
      await handleVerify(req, res);
    } else if (req.url === '/presentations/prove') {
      await handleProve(req, res);
    } else if (req.url === '/presentations/verify') {
      await handleVerifyVp(req, res);
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  } catch(e) {
    console.error(req.url, e)
    res.statusCode = 500;
    res.end(e.message);
  }
}

async function receiveJson(req) {
  const buf = await new Promise((resolve, reject) => {
    let bufs = [];
    req.on('error', reject);
    req.on('data', bufs.push.bind(bufs));
    req.on('end', () => {
      resolve(Buffer.concat(bufs));
    });
  });
  return JSON.parse(buf);
}

function serveJson(res, obj) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj))
}

function concatProof(existingProof, newProof) {
  if (!existingProof) {
    return newProof;
  } else if (!Array.isArray(existingProof)) {
    return [existingProof, newProof];
  } else {
    return existingProof.concat(newProof);
  }
}

async function handleIssue(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Expected POST');
  }
  const obj = await receiveJson(req);
  const {credential} = obj;
  if (!credential) {
    res.statusCode = 400;
    return res.end('Expected credential property');
  }
  if (!Array.isArray(credential.type)) {
    res.statusCode = 400;
    return res.end('Expected credential type array');
  }
  if (credential.type[0] !== 'VerifiableCredential') {
    res.statusCode = 400;
    return res.end('Expected credential type VerifiableCredential');
  }
  const context = credential['@context'];
  if (!Array.isArray(context) || context[0] !== baseContext) {
    res.statusCode = 400;
    return res.end('Expected @context ordered set with v2 base context');
  }
  let vc = {};
  for (const key in credential) {
    if (key === 'proof') continue;
    vc[key] = credential[key];
  }
  vc.proof = concatProof(credential.proof, {
    type: 'https://example.org/#ExampleTestSuiteProof'
  });
  vc.y = 'y';
  serveJson(res, vc);
}

async function handleVerify(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Expected POST');
  }
  let checks = [];
  let warnings = [];
  let errors = [];
  const obj = await receiveJson(req);
  const {verifiableCredential: vc} = obj;
  try {
    if (!vc) throw 'Expected verifiableCredential property';
    if (!Array.isArray(vc.type)) throw 'Expected verifiableCredential type array';
    if (vc.type[0] !== 'VerifiableCredential') throw 'Expected type VerifiableCredential';
    const context = vc['@context'];
    if (!context) throw 'Expected verifiableCredential @context property';
  } catch(e) {
    errors.push(e);
  }
  const result = {
    checks,
    warnings,
    errors
  };
  if (errors.length) res.statusCode = 400;
  serveJson(res, result);
}

async function handleProve(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Expected POST');
  }
  const obj = await receiveJson(req);
  const {presentation} = obj;
  if (!presentation) {
    res.statusCode = 400;
    return res.end('Expected presentation property');
  }
  const context = presentation['@context'];
  if (!context) {
    res.statusCode = 400;
    return res.end('Expected presentation @context property');
  }
  if (!Array.isArray(context) || context[0] !== baseContext) {
    res.statusCode = 400;
    return res.end('Expected @context ordered set with v2 base context');
  }
  let vp = {};
  for (const key in presentation) {
    if (key === 'proof') continue;
    vp[key] = presentation[key];
  }
  vp.proof = concatProof(presentation.proof, {
    type: 'https://example.org/#ExampleTestSuiteProof'
  });
  serveJson(res, vp);
}

async function handleVerifyVp(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Expected POST');
  }
  let checks = [];
  let warnings = [];
  let errors = [];
  const obj = await receiveJson(req);
  const {verifiablePresentation: vp} = obj;
  try {
    if (!vp) throw 'Expected verifiablePresentation property';
    const context = vp['@context'];
    if (!context) throw 'Expected verifiablePresentation @context property';
    // const proofs = Array.isArray(vp.proof) ? vp.proof : [vp.proof];
  } catch(e) {
    errors.push(e);
  }
  const result = {
    checks,
    warnings,
    errors
  };
  if (errors.length) res.statusCode = 400;
  serveJson(res, result);
}
