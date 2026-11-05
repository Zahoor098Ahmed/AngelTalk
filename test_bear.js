const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

console.log("water balloon == water snake?", p["water balloon"] === p["water snake"]);
console.log("tech top == water snake?", p["tech top"] === p["water snake"]);
console.log("tornado tube == water snake?", p["tornado tube"] === p["water snake"]);

// Save water snake base64 to disk to see what it is
const b64 = p["water snake"].replace(/^data:image\/png;base64,/, "");
fs.writeFileSync("sample_bear.png", Buffer.from(b64, 'base64'));
console.log("saved sample_bear.png");

