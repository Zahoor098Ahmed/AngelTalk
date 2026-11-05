const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const bearVal = p["water snake"];
const matchingBear = [];

for (const [k, v] of Object.entries(p)) {
  if (v === bearVal) {
    matchingBear.push(k);
  }
}

console.log("Total words in uniquePictures sharing the bear:", matchingBear.length);
console.log(matchingBear);

