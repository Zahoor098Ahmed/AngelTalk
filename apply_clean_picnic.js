const fs = require('fs');
const path = require('path');

const targetJsonPath = path.resolve('./frontend/src/modules/uniquePictures.json');
const p = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));

const buf = fs.readFileSync('clean_picnic_family.png');
p["picnic"] = `data:image/png;base64,${buf.toString('base64')}`;

fs.writeFileSync(targetJsonPath, JSON.stringify(p, null, 2), 'utf8');

console.log("Successfully updated picnic with pure white sides! Base64 len:", p["picnic"].length);

