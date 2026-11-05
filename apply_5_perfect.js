const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const files = {
  "gurdwara": "svg_gurdwara.svg",
  "temple": "svg_temple.svg",
  "store": "svg_store.svg",
  "plant room": "svg_plant_room.svg",
  "savannah": "svg_savannah.svg"
};

for (const [key, f] of Object.entries(files)) {
  const content = fs.readFileSync(f, 'utf8');
  p[key] = `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`;
  console.log(`Updated [${key}] with clean SVG! Length: ${p[key].length}`);
}

fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');
console.log("Successfully wrote all 5 into uniquePictures.json!");

