const fs = require('fs');

const fruits = JSON.parse(fs.readFileSync('fruits_words.json', 'utf8'));
const drinks = JSON.parse(fs.readFileSync('drinks_words.json', 'utf8'));
const current = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const allWords = [...fruits.map(w => ({ word: w, cat: 'Fruits' })), ...drinks.map(w => ({ word: w, cat: 'Drinks' }))];

console.log('Total items in Fruits and Drinks:', allWords.length);

const summary = [];
for (const item of allWords) {
  const k = item.word.toLowerCase();
  const val = current[k] || current['food and drinks::' + k] || null;
  let type = 'none';
  let len = 0;
  if (val) {
    if (val.startsWith('data:image/jpeg')) type = 'JPEG';
    else if (val.startsWith('data:image/png')) type = 'PNG';
    else if (val.startsWith('data:image/svg')) type = 'SVG';
    else type = 'URL: ' + val.slice(0, 30);
    len = val.length;
  }
  summary.push({ word: item.word, cat: item.cat, key: k, type, len });
}

console.log('Sample summary:');
summary.slice(0, 20).forEach(s => console.log(`${s.cat} | ${s.word}: ${s.type} (${s.len} chars)`));

const noImg = summary.filter(s => s.type === 'none');
console.log('Words without image:', noImg.length, noImg.map(s => s.word));
