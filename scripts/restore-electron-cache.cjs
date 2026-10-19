// Optional offline recovery. Only extracts an archive matching Electron's shipped SHA-256.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
async function run() {
  const electronDir = path.dirname(require.resolve('electron/package.json'));
  const { version } = require(path.join(electronDir, 'package.json'));
  const name = `electron-v${version}-win32-x64.zip`;
  const cache = process.argv[2] || path.join(process.env.LOCALAPPDATA, 'electron', 'Cache');
  const archive = fs.readdirSync(cache).map(folder => path.join(cache, folder, name)).find(file => fs.existsSync(file));
  if (!archive) throw new Error(`No cached ${name}. Run node node_modules/electron/install.js with network access.`);
  const expected = require(path.join(electronDir, 'checksums.json'))[name];
  const actual = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  if (!expected || actual !== expected) throw new Error('Cached Electron checksum mismatch');
  await require('@electron-internal/extract-zip').extract(archive, { dir: path.join(electronDir, 'dist') });
  fs.writeFileSync(path.join(electronDir, 'path.txt'), 'electron.exe');
  console.log(`Restored verified Electron ${version} from local cache.`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
