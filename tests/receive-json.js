/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
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
