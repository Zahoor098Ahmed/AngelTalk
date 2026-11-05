const fs = require('fs');
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
  if (!val) {
    console.log(w, "-> MISSING");
  } else if (val.includes("base64")) {
    console.log(w, "-> base64 length:", val.length);
  } else {
    console.log(w, "-> other:", val.slice(0, 40));
  }
});

