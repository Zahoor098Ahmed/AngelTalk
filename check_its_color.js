const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

// Check what its and itself are
console.log("its starts with:", p["its"]?.slice(0, 30));
console.log("itself starts with:", p["itself"]?.slice(0, 30));

fs.writeFileSync("sample_its.jpg", Buffer.from(p["its"].replace(/^data:image\/\w+;base64,/, ""), 'base64'));
fs.writeFileSync("sample_it.jpg", Buffer.from(p["it"].replace(/^data:image\/\w+;base64,/, ""), 'base64'));
console.log("Saved sample_its.jpg and sample_it.jpg");

