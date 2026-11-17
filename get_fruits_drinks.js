const fs = require('fs');

const vFile = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');

function getCategoryWords(catName) {
  const start = vFile.indexOf(`"name": "${catName}"`);
  if (start === -1) return [];
  const end = vFile.indexOf('"name":', start + 30);
  const block = vFile.slice(start, end !== -1 ? end : start + 3000);
  const lines = block.split('\n');
  const words = [];
  for (const l of lines) {
    const m = l.match(/"([^"]+)"/);
    if (m) {
      const val = m[1].trim();
      if (!['name', catName, 'icon', 'subs', 'words', '🍎', '🥤', 'Food and Drinks'].includes(val)) {
        words.push(val);
      }
    }
  }
  return words;
}

const fruits = getCategoryWords('Fruits');
const drinks = getCategoryWords('Drinks');

console.log('Fruits count:', fruits.length);
console.log('Sample fruits:', fruits.slice(0, 15));
console.log('Drinks count:', drinks.length);
console.log('Sample drinks:', drinks.slice(0, 15));

fs.writeFileSync('fruits_words.json', JSON.stringify(fruits, null, 2));
fs.writeFileSync('drinks_words.json', JSON.stringify(drinks, null, 2));
