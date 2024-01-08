/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  createRequestBody,
  createVerifyRequestBody
} from './mock.data.js';
import http from 'http';
import {proveVP} from './data-generator.js';
import receiveJson from './receive-json.js';

export class TestEndpoints {
  constructor({implementation, tag}) {
    this.implementation = implementation;
    this.tag = tag;
    this.verifier = implementation.verifiers.find(
      verifier => verifier.tags.has(tag));
    this. issuer = implementation.issuers.find(
      issuer => issuer.tags.has(tag));
    this.vpVerifier = implementation.vpVerifiers.find(
      vpVerifier => vpVerifier.tags.has(tag));
  }
  async issue(credential) {
    const {issuer} = this;
    const issueBody = createRequestBody({issuer, vc: credential});
    return post(issuer, issueBody);
  }
  async proveVP({presentation, options = {}}) {
    return proveVP({presentation, options});
  }
  async verify(vc) {
    const verifyBody = createVerifyRequestBody({vc});
    const result = await post(this.verifier, verifyBody);
    if(result?.errors?.length) {
      throw result.errors[0];
    }
    return result;
  }
  async verifyVp(vp, options = {checks: []}) {
    const body = {
      verifiablePresentation: vp,
      options
    };
    const result = await post(this.vpVerifier, body);
    if(result?.errors?.length) {
      throw result.errors[0];
    }
    return result;
  }
}

export async function post(endpoint, object) {
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
        Accept: 'application/json'
      }
    }, resolve);
    req.on('error', reject);
    req.end(postData);
  });
  const result = await receiveJson(res);
  if(res.statusCode >= 400) {
    if(result != null && result.errors) {
      throw new Error(result.errors);
    }
    throw new Error(result);
  }
  if(res.statusCode >= 300) {
    throw new Error('Redirect not supported');
  }
  return result;
}
