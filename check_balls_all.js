const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const ballKeys = [
  "ball-face", "ball-grape", "ball-inside out", "ball-mesh", "ball-net",
  "ball-orbiter", "ball-prickly", "ball-rattle", "ball-ribbon", "ball-spaghetti",
  "ball-spiky", "ball-squeeze", "ball-squish", "ball-squishy", "ball-stress",
  "ball-urchin", "ball-wacky"
];

ballKeys.forEach(k => {
  console.log(k, "->", p[k] ? p[k].slice(0, 30) : "MISSING");
});

