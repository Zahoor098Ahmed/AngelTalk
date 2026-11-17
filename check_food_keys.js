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
const oldDaf = readJsonFile('old_uniquePictures_daf1e1e.json');

let hasBare = 0;
let hasNs = 0;
let hasBoth = 0;

for (const w of foodWords) {
  const k = w.toLowerCase();
  const ns = 'food and drinks::' + k;
  const b = oldDaf[k];
  const n = oldDaf[ns];
  if (b) hasBare++;
  if (n) hasNs++;
  if (b && n) hasBoth++;
}

console.log(`Food words: ${foodWords.length}`);
console.log(`Has bare key in daf1e1e: ${hasBare}`);
console.log(`Has ns key in daf1e1e: ${hasNs}`);
console.log(`Has both: ${hasBoth}`);
