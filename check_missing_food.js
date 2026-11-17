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

const missing = [];
for (const w of foodWords) {
  const k = w.toLowerCase();
  if (!oldDaf[k]) {
    missing.push(w);
  }
}

console.log('Food words without image in daf1e1e:', missing);
