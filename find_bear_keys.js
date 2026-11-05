const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const bearKeys = [];
const bearVal = p["tornado tube"];

for (const [k, v] of Object.entries(p)) {
  if (v === bearVal) {
    bearKeys.push(k);
  }
}

console.log("Keys sharing tornado tube image (count:", bearKeys.length, "):");
console.log(bearKeys.slice(0, 30));

