const fs = require('fs');

const fruits = JSON.parse(fs.readFileSync('fruits_words.json', 'utf8'));
const drinks = JSON.parse(fs.readFileSync('drinks_words.json', 'utf8'));
const current = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const outDir = './inspect_fd';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const allWords = [...fruits.map(w => ({ word: w, cat: 'Fruits' })), ...drinks.map(w => ({ word: w, cat: 'Drinks' }))];

for (const item of allWords) {
  const k = item.word.toLowerCase();
  const val = current[k] || current['food and drinks::' + k];
  if (val && val.startsWith('data:image')) {
    const isPng = val.startsWith('data:image/png');
    const ext = isPng ? 'png' : 'jpg';
    const b64 = val.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(`${outDir}/${item.cat}_${k.replace(/[^a-z0-9_-]/g, '_')}.${ext}`, Buffer.from(b64, 'base64'));
  }
}

console.log('Saved all 77 images to ./inspect_fd');
