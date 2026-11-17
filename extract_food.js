const fs = require('fs');
const v = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');

const start = v.indexOf('"name": "Food and Drink"');
const end = v.indexOf('"name":', start + 30);
const block = v.slice(start, end !== -1 ? end : start + 3000);
const words = block.match(/"([^"]+)"/g).map(s => s.replace(/"/g, '')).filter(w => !['name', 'Food and Drink', 'icon', '🍔', 'subs', 'words'].includes(w));
console.log('Food words count:', words.length);
console.log('Sample food words:', words.slice(0, 10));

fs.writeFileSync('food_words.json', JSON.stringify(words, null, 2));
