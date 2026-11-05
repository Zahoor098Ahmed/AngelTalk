const fs = require('fs');

const vocab = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');
const lines = vocab.split('\n');

let inPronouns = false;
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('"name": "pronouns"') || l.toLowerCase().includes('"pronouns"')) {
    inPronouns = true;
  }
  if (inPronouns) {
    console.log(`${i+1}: ${l}`);
    if (l.includes(']')) inPronouns = false;
  }
});

