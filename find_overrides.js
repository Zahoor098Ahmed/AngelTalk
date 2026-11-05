const fs = require('fs');

const cat = fs.readFileSync('./frontend/src/modules/customCategories.ts', 'utf8');
const lines = cat.split('\n');

lines.forEach((l, i) => {
  if (l.toLowerCase().includes('picnic') || l.toLowerCase().includes('jungle gym')) {
    console.log(`${i+1}: ${l.slice(0, 100)}`);
  }
});

