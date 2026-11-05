const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const museumSvg = fs.readFileSync('svg_museum_perfect.svg', 'utf8');
p["museum"] = `data:image/svg+xml;base64,${Buffer.from(museumSvg).toString('base64')}`;

fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');

console.log("Successfully updated museum with grand neoclassical building on pure white background!");
console.log("New length:", p["museum"].length);

