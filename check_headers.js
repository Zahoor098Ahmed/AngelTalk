const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const words = [
  "airport", "bakery", "barber shop", "book store", "castle", "hotel", "mosque"
];

words.forEach(w => {
  const val = p[w];
  console.log(w, "header:", val ? val.slice(0, 30) : "none");
});

