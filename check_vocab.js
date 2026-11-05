const fs = require('fs');
const vocab = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');

const lines = vocab.split('\n');
lines.forEach((l, i) => {
  if (l.includes('3d glasses') || l.includes('water balloon') || l.includes('water snake') || l.includes('tornado tube') || l.includes('tech top') || l.includes('wiggle pen')) {
    console.log(`${i+1}: ${l}`);
  }
});

