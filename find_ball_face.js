const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const ballFace = p["ball-face"];
const matching = [];

for (const [k, v] of Object.entries(p)) {
  if (v === ballFace) {
    matching.push(k);
  }
}

console.log("Total sharing ball-face image:", matching.length);
console.log(matching);

