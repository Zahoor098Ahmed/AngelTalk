const fs = require('fs');

// check what dictUrl returns or what is in uniquePictures for 3d glasses, action toy, etc.
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));
const words = [
  "3d glasses",
  "action toy",
  "ball popper",
  "water balloon",
  "water snake",
  "tech top",
  "tornado tube",
  "wiggle pen",
  "zip line",
  "splash pad",
  "picnic",
  "picnic table",
  "pond",
  "roundabout",
  "lamp post"
];

words.forEach(w => {
  const val = p[w];
  console.log(w, val ? val.slice(0, 50) : "not in uniquePictures");
});

