/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import * as vc from '@digitalbazaar/vc';
import {CONTEXT, CONTEXT_URL} from '@digitalbazaar/data-integrity-context';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {
  cryptosuite as eddsa2022Cryptosuite
} from '@digitalbazaar/eddsa-2022-cryptosuite';
import {klona} from 'klona';

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

/**
 * An extremely basic VP prover. This is not final
 * and will probably change.
 *
 * @param {object} options - Options to use.
 * @param {object} options.presentation - An unsigned VP.
 * @param {object} options.options - Options for the VP.
 *
 * @returns {Promise<object>} Resolves to a signed Vp.
 */
export async function proveVP({presentation, options = {}}) {
  if(!options.suite) {
    const verificationKeyPair = await ed25519Multikey.from({
      id: 'did:key:z6MkpJySvETLnxhQG9DzEdmKJtysBDjuuTeDfUj1uNNCUqcj',
      controller: 'did:key:z6MkpJySvETLnxhQG9DzEdmKJtysBDjuuTeDfUj1uNNCUqcj',
      publicKeyMultibase: 'z6MkpJySvETLnxhQG9DzEdmKJtysBDjuuTeDfUj1uNNCUqcj',
      secretKeyMultibase: 'zrv1a6V2qqSGkBz7QPw4yJedKc8X9dEdug7c3MEzNUDVEmkyV' +
        'cXtTWNLQLArgKXzN7LbGMTVjqE2CbdrqpnxqtxmY1M',
    });
    options.suite = new DataIntegrityProof({
      signer: verificationKeyPair.signer(),
      cryptosuite: eddsa2022Cryptosuite
    });
  }
  options.documentLoader = options.documentLoader || _documentLoader;
  // sign those vcs
  if(presentation?.verifiableCredential) {
    presentation.verifiableCredential = await Promise.all(
      presentation.verifiableCredential.map(credential => {
        // if there is already a proof don't add it
        if(credential.proof) {
          return credential;
        }
        return vc.issue({credential: klona(credential), ...options});
      }));
  }
  const vp = await vc.signPresentation({
    presentation: klona(presentation),
    ...options
  });
  return vp;
}
