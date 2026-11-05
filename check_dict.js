const fs = require('fs');

const d = JSON.parse(fs.readFileSync('./frontend/src/modules/arasaacDict.json', 'utf8'));
console.log("arasaacDict picnic:", d["picnic"]);
console.log("arasaacDict gazebo:", d["gazebo"]);

