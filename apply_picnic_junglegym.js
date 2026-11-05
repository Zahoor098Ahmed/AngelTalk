const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const picnicSvg = fs.readFileSync('svg_perfect_picnic.svg', 'utf8');
const jungleGymSvg = fs.readFileSync('svg_perfect_jungle_gym.svg', 'utf8');

p["picnic"] = `data:image/svg+xml;base64,${Buffer.from(picnicSvg).toString('base64')}`;
p["jungle gym"] = `data:image/svg+xml;base64,${Buffer.from(jungleGymSvg).toString('base64')}`;

fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');

console.log("Successfully updated picnic and jungle gym in uniquePictures.json!");
console.log("picnic len:", p["picnic"].length);
console.log("jungle gym len:", p["jungle gym"].length);

