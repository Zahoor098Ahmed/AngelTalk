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

const artDir = 'C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59';

let diffCount = 0;
for (const w of foodWords) {
  const k = w.toLowerCase();
  const ns = 'food and drinks::' + k;
  const v78 = old78[ns] || old78[k];
  const vDaf = oldDaf[ns] || oldDaf[k];
  if (v78 !== vDaf) {
    diffCount++;
    if (diffCount <= 3) {
      fs.writeFileSync(`${artDir}/diff_${diffCount}_${k}_78.jpg`, Buffer.from(v78.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
      fs.writeFileSync(`${artDir}/diff_${diffCount}_${k}_daf.jpg`, Buffer.from(vDaf.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
      console.log(`Diff ${diffCount}: ${k}, len78=${v78.length}, lenDaf=${vDaf.length}`);
    }
  }
}
