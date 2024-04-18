/*
 * Copyright 2022 - 2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

export default async function receiveJson(stream) {
  const bufs = [];
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('data', bufs.push.bind(bufs));
    stream.on('end', resolve);
  });
  const buf = Buffer.concat(bufs);
  return JSON.parse(buf);
}
