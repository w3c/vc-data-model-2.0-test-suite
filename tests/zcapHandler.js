import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import {decodeSecretKeySeed} from 'bnid';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
import {ZcapClient} from '@digitalbazaar/ezcap';

export async function makeZcapRequest(settings, body) {
  const capability = JSON.parse(settings.zcap.capability);
  const controller = capability.controller;
  // only supports did key
  const id = controller + '#' + controller.slice('did:key:'.length);
  const verificationKeyPair = await Ed25519Multikey.generate({
    id,
    controller,
    seed: decodeSecretKeySeed({
      secretKeySeed: process.env[settings.zcap.keySeed]
    })
  });
  const zcapClient = new ZcapClient({
    SuiteClass: Ed25519Signature2020,
    invocationSigner: verificationKeyPair.signer(),
    delegationSigner: verificationKeyPair.signer(),
  });
  const response = await zcapClient.write({
    url: settings.endpoint,
    json: body,
    capability: JSON.parse(settings.zcap.capability)
  });
  return response;
}
