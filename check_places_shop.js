const fs = require('fs');

const vocab = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');
const lines = vocab.split('\n');

let inPlaces = false;
lines.forEach((l, i) => {
  if (l.includes('"name": "Places"') || l.includes('"Places"')) {
    inPlaces = true;
  }
  if (inPlaces) {
    if (l.includes('"shops"') || l.includes('"shop"')) {
      console.log(`line ${i+1}: ${l}`);
    }
    if (l.includes(']')) inPlaces = false;
  }
});

