const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

console.log("picnic starts with:", p["picnic"]?.slice(0, 40));
console.log("jungle gym starts with:", p["jungle gym"]?.slice(0, 40));

// Check if jungle gym has white background or something else
if (p["jungle gym"]) {
  fs.writeFileSync("current_jungle_gym.png", Buffer.from(p["jungle gym"].replace(/^data:image\/\w+;base64,/, ""), 'base64'));
}
if (p["picnic"]) {
  fs.writeFileSync("current_picnic.png", Buffer.from(p["picnic"].replace(/^data:image\/\w+;base64,/, ""), 'base64'));
}
console.log("saved current files");

