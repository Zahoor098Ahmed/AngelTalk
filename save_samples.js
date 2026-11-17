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

const old78 = readJsonFile('old_uniquePictures_78a60fb.json');
const oldDaf = readJsonFile('old_uniquePictures_daf1e1e.json');
const current = readJsonFile('./frontend/src/modules/uniquePictures.json');

const artDir = 'C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59';

const samples = ['apple', 'bread', 'baguette roll', 'butter', 'pizza', 'chicken'];

for (const s of samples) {
  const v78 = old78[s] || old78['food and drinks::' + s];
  const vDaf = oldDaf[s] || oldDaf['food and drinks::' + s];
  const vCurr = current[s] || current['food and drinks::' + s];

  if (v78 && v78.startsWith('data:image')) {
    const ext = v78.includes('png') ? 'png' : 'jpg';
    fs.writeFileSync(`${artDir}/sample_${s}_78.${ext}`, Buffer.from(v78.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  }
  if (vDaf && vDaf.startsWith('data:image')) {
    const ext = vDaf.includes('png') ? 'png' : 'jpg';
    fs.writeFileSync(`${artDir}/sample_${s}_daf.${ext}`, Buffer.from(vDaf.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  }
  if (vCurr && vCurr.startsWith('data:image')) {
    const ext = vCurr.includes('png') ? 'png' : 'jpg';
    fs.writeFileSync(`${artDir}/sample_${s}_curr.${ext}`, Buffer.from(vCurr.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  }
}

console.log('Saved comparison samples to artifacts dir');
