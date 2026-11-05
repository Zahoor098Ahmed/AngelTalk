const fs = require('fs');

let headStr = fs.readFileSync('head_uniquePictures.json', 'utf16le');
if (headStr.charCodeAt(0) === 0xFEFF) headStr = headStr.slice(1);
const head = JSON.parse(headStr);

const pPath = './frontend/src/modules/uniquePictures.json';
const curr = JSON.parse(fs.readFileSync(pPath, 'utf8'));

// Extract list of all sports words
const vFile = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');
const start = vFile.indexOf('"name": "Sports and Fitness"');
const end = vFile.indexOf('"name": "Tools and Supplies"');
const block = vFile.slice(start, end);
const words = block.match(/"([^"]+)"/g).map(s => s.replace(/"/g, '')).filter(w => !['name', 'Sports and Fitness', 'icon', '⚽', 'subs', 'words'].includes(w));

console.log('Restoring sports words count:', words.length);

let restored = 0;
for (const w of words) {
  const k = w.toLowerCase();
  const ns = 'sports and fitness::' + k;

  // Restore bare key
  if (head[k] !== undefined) {
    curr[k] = head[k];
  } else {
    delete curr[k];
  }

  // Restore namespaced key
  if (head[ns] !== undefined) {
    curr[ns] = head[ns];
  } else {
    delete curr[ns];
  }
  restored++;
}

fs.writeFileSync(pPath, JSON.stringify(curr, null, 2), 'utf8');
console.log('Successfully restored all ' + restored + ' sports words exactly to HEAD!');

