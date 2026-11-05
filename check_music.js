const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

const musicWords = [
  "vibraslap", "tom tom", "smile drum", "shaker", "rhythm stick",
  "guitar pick", "hi-hat", "bugle", "cajon", "chimes", "bell stick", "brushes"
];

musicWords.forEach(w => {
  console.log(w, "->", p[w] ? p[w].slice(0, 30) : "MISSING");
});

