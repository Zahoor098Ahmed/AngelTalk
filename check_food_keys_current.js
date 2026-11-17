const fs = require('fs');

function readJsonFile(path) {
  const buf = fs.readFileSync(path);
  if (buf[0] === 0xFF && buf[1] === 0xFE) {
    let str = buf.toString('utf16le');
    if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
    return JSON.parse(str);
  }
  let str = buf.toString('utf8');
  if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
  return JSON.parse(str);
}

const foodWords = readJsonFile('all_food_words.json');
const current = readJsonFile('./frontend/src/modules/uniquePictures.json');

let hasBare = 0;
let hasNs = 0;
let hasBoth = 0;

for (const w of foodWords) {
  const k = w.toLowerCase();
  const ns = 'food and drinks::' + k;
  const b = current[k];
  const n = current[ns];
  if (b) hasBare++;
  if (n) hasNs++;
  if (b && n) hasBoth++;
}

console.log(`Food words: ${foodWords.length}`);
console.log(`Has bare key in current: ${hasBare}`);
console.log(`Has ns key in current: ${hasNs}`);
console.log(`Has both in current: ${hasBoth}`);
