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
const pPath = './frontend/src/modules/uniquePictures.json';
const current = readJsonFile(pPath);

let restoredCount = 0;
for (const w of foodWords) {
  const k = w.toLowerCase();
  const ns = 'food and drinks::' + k;

  if (oldDaf[k] !== undefined) {
    current[k] = oldDaf[k];
    restoredCount++;
  } else {
    delete current[k];
  }

  if (oldDaf[ns] !== undefined) {
    current[ns] = oldDaf[ns];
  } else {
    delete current[ns];
  }
}

fs.writeFileSync(pPath, JSON.stringify(current, null, 2), 'utf8');
console.log(`Successfully restored ${restoredCount} food items back to original clean real photos!`);
