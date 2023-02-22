export default async function receiveJson(stream) {
  let bufs = [];
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('data', bufs.push.bind(bufs));
    stream.on('end', resolve);
  });
  const buf = Buffer.concat(bufs);
  return JSON.parse(buf);
}
