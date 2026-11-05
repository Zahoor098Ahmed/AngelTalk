const fs = require('fs');

const cc = fs.readFileSync('./frontend/src/modules/customCategories.ts', 'utf8');
const lines = cc.split('\n');

lines.forEach((l, i) => {
  if (l.includes('RENAME') || l.includes('rename') || l.includes('RETIRED_BUILTIN_WORDS')) {
    console.log(`line ${i+1}: ${l.slice(0, 80)}`);
  }
});

