const fs = require('fs');

const p = JSON.parse(fs.readFileSync('./frontend/src/modules/uniquePictures.json', 'utf8'));

Object.keys(p).forEach(k => {
  if (k.includes('goldilocks') || k.includes('bear') || k.includes('picnic')) {
    console.log(`key in uniquePictures: "${k}"`);
  }
});

