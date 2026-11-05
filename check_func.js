const fs = require('fs');
const code = fs.readFileSync('./frontend/src/modules/customCategories.ts', 'utf8');

const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('getPictogramUrl') || l.includes('dictUrl') || l.includes('pictureFixFor') || l.includes('canonicalWordEn')) {
    console.log(`${i+1}: ${l.slice(0, 100)}`);
  }
});

