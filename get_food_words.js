const fs = require('fs');

const vFile = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');

// The Food and Drinks category starts around line 1878
const startIdx = vFile.indexOf('"name": "Food and Drinks"');
// The next main category is Health and Medical
const endIdx = vFile.indexOf('"name": "Health and Medical"');

const block = vFile.slice(startIdx, endIdx);
const lines = block.split('\n');

const foodWords = [];
for (const line of lines) {
  const m = line.match(/"([^"]+)"/);
  if (m) {
    const val = m[1].trim();
    if (!['name', 'Food and Drinks', 'icon', '🍔', 'subs', 'words',
          'Breads', '🍞', 'Condiments', '🧂', 'Dairy and Eggs', '🧀',
          'Drinks', '🥤', 'Fruits', '🍎', 'Meats and fish', '🥩',
          'Cooked food', '🍲', 'Nuts', '🥜', 'Soups', '🥣',
          'Sweets', '🍬', 'Vegetables', '🥕'].includes(val)) {
      foodWords.push(val);
    }
  }
}

console.log('Total food words found:', foodWords.length);
console.log('Sample food words:', foodWords.slice(0, 15));
fs.writeFileSync('all_food_words.json', JSON.stringify(foodWords, null, 2));
