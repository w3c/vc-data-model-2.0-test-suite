/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import vc from '@digitalbazaar/vc';

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
export async function proveVP({presentation, options}) {
  return vc.signPresentation({presentation, ...options});
}
