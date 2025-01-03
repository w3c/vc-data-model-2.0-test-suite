/*
 * Copyright 2023 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import * as ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import * as vc from '@digitalbazaar/vc';
import {CONTEXT, CONTEXT_URL} from '@digitalbazaar/data-integrity-context';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {
  cryptosuite as eddsaRdfc2020Cryptosuite
} from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import jsigs from 'jsonld-signatures';
import {klona} from 'klona';
import {randomFillSync} from 'node:crypto';

const {AuthenticationProofPurpose} = jsigs.purposes;

// use base64 encoded 128 bit number as the challenge
const buf = Buffer.alloc(16); // 128 bits
export const challenge = 'u' + randomFillSync(buf).toString('base64url');
export const domain = 'github.com/w3c/vc-data-model-2.0-test-suite';
export const localIssuer =
  'did:key:z6MkpJySvETLnxhQG9DzEdmKJtysBDjuuTeDfUj1uNNCUqcj';

const _documentLoader = url => {
  // adds support for the data integrity context
  if(url === CONTEXT_URL) {
    return {
      contextUrl: null,
      documentUrl: url,
      document: CONTEXT
    };
  }
  // adds support for the examples context
  if(url === 'https://www.w3.org/ns/credentials/examples/v2') {
    return {
      contextUrl: null,
      documentUrl: url,
      document: {
        '@context': {
          '@vocab': 'https://www.w3.org/ns/credentials/examples#'
        }
      }
    };
  }
  return vc.defaultDocumentLoader(url);
};

async function getKeys() {
  const publicKeyMultibase = 'z6MkpJySvETLnxhQG9DzEdmKJtysBDjuuTeDfUj1uNNC' +
    'Uqcj';
  const id = `did:key:${publicKeyMultibase}`;
  const verificationKeyPair = await ed25519Multikey.from({
    id,
    controller: 'did:key:z6MkpJySvETLnxhQG9DzEdmKJtysBDjuuTeDfUj1uNNCUqcj',
    publicKeyMultibase,
    secretKeyMultibase: 'zrv1a6V2qqSGkBz7QPw4yJedKc8X9dEdug7c3MEzNUDVEmkyV' +
      'cXtTWNLQLArgKXzN7LbGMTVjqE2CbdrqpnxqtxmY1M',
  });
  const signer = verificationKeyPair.signer();
  signer.id = `did:key:${publicKeyMultibase}#${publicKeyMultibase}`;
  return {signer, keyPair: verificationKeyPair};
}

/**
 * An extremely basic local VP creator. This is not final
 * and will probably change.
 *
 * @param {object} options - Options to use.
 * @param {object} options.presentation - An unsigned VP.
 * @param {object} options.options - Options for the VP.
 *
 * @returns {Promise<object>} Resolves to a signed VP.
 */
export async function createLocalVp({presentation, options = {}}) {
  const _presentation = klona(presentation);
  const {signer, keyPair} = await getKeys({options});
  options.suite = new DataIntegrityProof({
    signer,
    cryptosuite: eddsaRdfc2020Cryptosuite
  });
  options.documentLoader = options.documentLoader || _documentLoader;
  // sign those vcs
  if(_presentation?.verifiableCredential) {
    _presentation.verifiableCredential = await _signCredentials({
      credentials: _presentation.verifiableCredential,
      keyPair,
      options
    });
  }
  return vc.signPresentation({
    presentation: _presentation,
    domain,
    challenge,
    ...options
  });
}

export async function createInvalidVp({
  presentation,
  testLoader = _documentLoader,
  options = {challenge, domain, safe: false}
}) {
  const _presentation = klona(presentation);
  options.purpose = new AuthenticationProofPurpose({
    challenge: options.challenge
  });
  const {signer, keyPair} = await getKeys({options});
  options.suite = new DataIntegrityProof({
    signer,
    cryptosuite: eddsaRdfc2020Cryptosuite
  });
  options.documentLoader = testLoader;
  // sign those vcs
  if(_presentation?.verifiableCredential) {
    _presentation.verifiableCredential = await _signCredentials({
      credentials: _presentation.verifiableCredential,
      keyPair,
      options
    });
  }
  return jsigs.sign(_presentation, options);
}

async function _signCredentials({credentials, keyPair, options}) {
  return Promise.all(credentials.map(credential => {
    // if there is already a proof don't add it
    if(credential.proof) {
      return credential;
    }
    credential.issuer = keyPair.id;
    return vc.issue({credential: klona(credential), ...options});
  }));
}

export function createTimeStamp({date = new Date(), skewYears = 0}) {
  date.setFullYear(date.getFullYear() + skewYears);
  const isoString = date.toISOString();
  return `${isoString.substring(0, isoString.length - 5)}Z`;
}
