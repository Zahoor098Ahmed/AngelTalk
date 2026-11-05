const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const toyKeys = Object.keys(p).filter(k => k.includes("pop") || k.includes("toy") || k.includes("balloon") || k.includes("water"));
console.log(toyKeys.slice(0, 30));

