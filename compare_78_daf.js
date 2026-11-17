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

const diffs = [];
for (const w of foodWords) {
  const k = w.toLowerCase();
  const ns = 'food and drinks::' + k;
  const v78 = old78[ns] || old78[k];
  const vDaf = oldDaf[ns] || oldDaf[k];
  if (v78 !== vDaf) {
    diffs.push({
      word: w,
      type78: v78 ? v78.slice(0, 30) : null,
      typeDaf: vDaf ? vDaf.slice(0, 30) : null
    });
  }
}

console.log('Sample diffs 78 vs daf (first 10):');
diffs.slice(0, 10).forEach(d => console.log(d.word, '\n 78:', d.type78, '\n daf:', d.typeDaf));
