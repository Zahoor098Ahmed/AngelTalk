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
console.log('Checking food words:', foodWords.length);

const old78 = readJsonFile('old_uniquePictures_78a60fb.json');
const oldDaf = readJsonFile('old_uniquePictures_daf1e1e.json');
const current = readJsonFile('./frontend/src/modules/uniquePictures.json');

let diff78vsDaf = 0;
let diffCurrentVs78 = 0;
let diffCurrentVsDaf = 0;

const sampleDiffs = [];

for (const w of foodWords) {
  const k = w.toLowerCase();
  const ns = 'food and drinks::' + k;

  const v78 = old78[ns] || old78[k];
  const vDaf = oldDaf[ns] || oldDaf[k];
  const vCurr = current[ns] || current[k];

  if (v78 !== vDaf) {
    diff78vsDaf++;
  }
  if (vCurr !== v78) {
    diffCurrentVs78++;
    if (sampleDiffs.length < 10) {
      sampleDiffs.push({ word: w, has78: !!v78, hasCurr: !!vCurr, len78: v78 ? v78.length : 0, lenCurr: vCurr ? vCurr.length : 0 });
    }
  }
  if (vCurr !== vDaf) {
    diffCurrentVsDaf++;
  }
}

console.log(`Diff 78a60fb vs daf1e1e (food): ${diff78vsDaf}`);
console.log(`Diff current vs 78a60fb (food): ${diffCurrentVs78}`);
console.log(`Diff current vs daf1e1e (food): ${diffCurrentVsDaf}`);
console.log('Sample diffs:', sampleDiffs);
