const fs = require('node:fs');
const path = require('node:path');
for (const folder of ['ui', 'native']) {
  fs.cpSync(path.join('src', folder), path.join('dist', folder), { recursive: true });
}
