const fs = require('fs');
const v = fs.readFileSync('./frontend/src/modules/clientVocabulary.ts', 'utf8');

const regex = /"name":\s*"([^"]+)"/g;
let m;
while ((m = regex.exec(v)) !== null) {
  console.log(m[1]);
}
