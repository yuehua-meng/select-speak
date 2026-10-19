const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const repo = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const revision = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';
const destination = path.resolve(__dirname, '../models/kokoro');
const files = [
  { name: 'config.json', size: 44, git: '790faf216e7e3f490e71e8bc80df79ed8941101c' },
  { name: 'tokenizer.json', size: 3497, git: '4280f55fc1c32211bc9bb4d55545759a00054ecd' },
  { name: 'tokenizer_config.json', size: 113, git: '5c81e9a3a06db9139900d6ee5b60e8bb701ccb0b' },
  { name: 'onnx/model.onnx', size: 325532232, sha256: '8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb' }
];
async function valid(file, name) {
  if (!fs.existsSync(name) || fs.statSync(name).size !== file.size) return false;
  const hash = crypto.createHash(file.sha256 ? 'sha256' : 'sha1');
  if (file.git) hash.update(`blob ${file.size}\0`);
  for await (const chunk of fs.createReadStream(name)) hash.update(chunk);
  return hash.digest('hex') === (file.sha256 || file.git);
}
async function run() {
  for (const file of files) {
    const target = path.join(destination, file.name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (await valid(file, target)) { console.log(`Verified existing ${file.name}`); continue; }
    const origins = process.env.HF_ENDPOINT ? [process.env.HF_ENDPOINT] : ['https://huggingface.co', 'https://hf-mirror.com'];
    let success = false;
    for (const origin of origins) {
      try {
        console.log(`Downloading ${file.name} from ${origin}`);
        const response = await fetch(`${origin}/${repo}/resolve/${revision}/${file.name}?download=true`, { signal: AbortSignal.timeout(900000) });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        let downloaded = 0, last = 0;
        const stream = Readable.fromWeb(response.body);
        stream.on('data', chunk => { downloaded += chunk.length; if (downloaded - last > 32 * 1024 * 1024) { last = downloaded; console.log(`${file.name}: ${Math.round(downloaded / file.size * 100)}%`); } });
        await pipeline(stream, fs.createWriteStream(target + '.partial'));
        if (!await valid(file, target + '.partial')) throw new Error(`Checksum mismatch: ${file.name}`);
        fs.renameSync(target + '.partial', target); success = true; break;
      } catch (error) { console.error(`${origin}: ${error.message}`); }
    }
    if (!success) throw new Error(`Unable to download verified ${file.name}`);
  }
  fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify({ repo, revision, precision: 'fp32', license: 'Apache-2.0', files, verifiedAt: new Date().toISOString() }, null, 2));
  const packageDir = path.resolve(path.dirname(require.resolve('kokoro-js')), '..');
  fs.copyFileSync(path.join(packageDir, 'LICENSE'), path.join(destination, 'LICENSE-APACHE-2.0.txt'));
  console.log('Kokoro model ready. Runtime uses local files only.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
