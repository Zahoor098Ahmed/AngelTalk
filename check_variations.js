const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const testWords = [
  "zipline", "zip line",
  "lamp post", "light post", "street lamp",
  "picnic", "picnic table",
  "roundabout", "merry-go-round", "carousel",
  "splash pad", "water park",
  "tech top", "spinning top"
];

testWords.forEach(w => {
  if (w in p) console.log("Key in p:", w);
});

