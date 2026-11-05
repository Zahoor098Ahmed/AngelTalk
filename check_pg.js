const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

console.log("uniquePictures picnic:", p["picnic"] ? p["picnic"].slice(0, 50) : "MISSING");
console.log("uniquePictures gazebo:", p["gazebo"] ? p["gazebo"].slice(0, 50) : "MISSING");

// Let's check pecsPictograms and pictureFixes
const pecs = JSON.parse(fs.readFileSync('./frontend/src/modules/pecsPictograms.json', 'utf8'));
const fixes = JSON.parse(fs.readFileSync('./frontend/src/modules/pictureFixes.json', 'utf8'));

console.log("pecs picnic:", pecs["picnic"]);
console.log("pecs gazebo:", pecs["gazebo"]);
console.log("fixes picnic:", fixes["picnic"]);
console.log("fixes gazebo:", fixes["gazebo"]);

