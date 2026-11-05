const fs = require('fs');

const vocab = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');
const lines = vocab.split('\n');

let inPark = false;
lines.forEach((l, i) => {
  if (l.includes('"name": "Park"') || l.includes('"Park"')) {
    inPark = true;
  }
  if (inPark) {
    console.log(`${i+1}: ${l}`);
    if (l.includes(']')) inPark = false;
  }
});

