const fs = require('fs');

const vocab = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');
const lines = vocab.split('\n');

lines.forEach((l, i) => {
  if (l.trim() === '"shops",' || l.trim() === '"shops"') {
    console.log(`line ${i+1}: ${l}`);
  }
});

