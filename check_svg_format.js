const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

for (const [k, v] of Object.entries(p)) {
  if (v.startsWith("data:image/svg")) {
    console.log(k, "->", v.slice(0, 50));
    break;
  }
}

