const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

console.log("p[picnic] starts with:", p["picnic"].slice(0, 50));
console.log("p[picnic] length:", p["picnic"].length);

// What is in customCategories.ts for picnic?
const cc = fs.readFileSync('./frontend/src/modules/customCategories.ts', 'utf8');
const lines = cc.split('\n');
lines.forEach((l, i) => {
  if (l.includes('"picnic"') || l.includes('picnic:')) {
    console.log(`line ${i+1}: ${l}`);
  }
});

