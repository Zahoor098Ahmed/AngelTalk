const fs = require('fs');

const file = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

// Extract words in Sports and Fitness
const start = file.indexOf('"name": "Sports and Fitness"');
const end = file.indexOf('"name": "Tools and Supplies"');
const block = file.slice(start, end);

const wordsMatch = block.match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
// remove keys like name, icon, subs, words, Sports and Fitness, etc.
const words = wordsMatch.filter(w => !['name', 'Sports and Fitness', 'icon', '⚽', 'subs', 'words'].includes(w));

console.log('Total words in Sports:', words.length);

const results = [];
for (const w of words) {
  const key = w.toLowerCase();
  const nsKey = 'sports and fitness::' + key;
  const val = p[nsKey] || p[key] || null;
  results.push({ word: w, key, val });
}

fs.writeFileSync('sports_words_info.json', JSON.stringify(results, null, 2));
console.log('Saved sports_words_info.json');

