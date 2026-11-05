const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const gazeboSvg = fs.readFileSync('svg_gazebo.svg', 'utf8');
const picnicSvg = fs.readFileSync('svg_picnic_clean.svg', 'utf8');

p["gazebo"] = `data:image/svg+xml;base64,${Buffer.from(gazeboSvg).toString('base64')}`;
p["picnic"] = `data:image/svg+xml;base64,${Buffer.from(picnicSvg).toString('base64')}`;

fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');

console.log("Updated uniquePictures.json successfully!");
console.log("gazebo len:", p["gazebo"].length);
console.log("picnic len:", p["picnic"].length);

