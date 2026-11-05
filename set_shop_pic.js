const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

if (p["shops"]) {
  p["shop"] = p["shops"];
  console.log("Set p['shop'] = p['shops'], length:", p["shop"].length);
  fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');
  console.log("Saved uniquePictures.json!");
} else {
  console.error("p['shops'] not found!");
}

