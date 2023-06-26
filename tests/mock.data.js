/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {createRequire} from 'node:module';
import {klona} from 'klona';
const require = createRequire(import.meta.url);
const validVc = require('./validVc.json');

// copies a validVc
export const createRequestBody = ({issuer, vc = validVc}) => {
  const {settings: {id, options}} = issuer;
  const credential = klona(vc);
  credential.issuer = credential?.issuer || id;
  // convert from millisecond to seconds precision
  // credential.issuanceDate = createISOTimeStamp();
  // credential.issuer = id;
  return {
    credential,
    options
  };
};

export const createVerifyRequestBody = ({vc}) => {
  const body = {
    verifiableCredential: vc,
    options: {
      checks: ['proof'],
    }
  };
  return body;
};

/**
 * Creates an ISO TimeStamp seconds precision.
 *
 * @param {number} [timeMs = Date.now()] - Milliseconds since epoch.
 *
 * @returns {string} An ISO Time Stamp.
 */
export function createISOTimeStamp(timeMs = Date.now()) {
  return new Date(timeMs).toISOString().replace(/\.\d+Z$/, 'Z');
}
