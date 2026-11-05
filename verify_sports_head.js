const fs = require('fs');

let headStr = fs.readFileSync('head_uniquePictures.json', 'utf16le');
if (headStr.charCodeAt(0) === 0xFEFF) headStr = headStr.slice(1);
const head = JSON.parse(headStr);
const curr = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const vFile = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');
const start = vFile.indexOf('"name": "Sports and Fitness"');
const end = vFile.indexOf('"name": "Tools and Supplies"');
const block = vFile.slice(start, end);
const words = block.match(/"([^"]+)"/g).map(s => s.replace(/"/g, '')).filter(w => !['name', 'Sports and Fitness', 'icon', '⚽', 'subs', 'words'].includes(w));

let diffCount = 0;
for (const w of words) {
  const k = w.toLowerCase();
  const ns = 'sports and fitness::' + k;

  if (curr[k] !== head[k]) {
    console.log(`Diff on bare key: ${k}`);
    diffCount++;
  }
  if (curr[ns] !== head[ns]) {
    console.log(`Diff on ns key: ${ns}`);
    diffCount++;
  }
}

console.log(`Total diff count for sports against HEAD: ${diffCount}`);

