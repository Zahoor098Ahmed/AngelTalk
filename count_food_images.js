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
const old78 = readJsonFile('old_uniquePictures_78a60fb.json');
const oldDaf = readJsonFile('old_uniquePictures_daf1e1e.json');

let count78 = 0;
let countDaf = 0;

for (const w of foodWords) {
  const k = w.toLowerCase();
  const ns = 'food and drinks::' + k;
  if (old78[ns] || old78[k]) count78++;
  if (oldDaf[ns] || oldDaf[k]) countDaf++;
}

console.log(`Food words with images in 78a60fb: ${count78} / ${foodWords.length}`);
console.log(`Food words with images in daf1e1e: ${countDaf} / ${foodWords.length}`);
