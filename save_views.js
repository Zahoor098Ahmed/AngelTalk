const fs = require('fs');
const current = require('./frontend/src/modules/uniquePictures.json');
const artDir = 'C:/Users/Zahoor/.gemini/antigravity/brain/df1543ec-f51c-462a-93bd-2beca8b87e59';

['banana', 'orange_juice', 'orange juice', 'mango', 'strawberry', 'water', 'milk', 'coffee'].forEach(k => {
  const v = current[k.toLowerCase()];
  if (v && v.startsWith('data:image')) {
    const ext = v.includes('png') ? 'png' : 'jpg';
    fs.writeFileSync(`${artDir}/view_${k.replace(/ /g, '_')}.${ext}`, Buffer.from(v.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  }
});
console.log('Saved view files');
