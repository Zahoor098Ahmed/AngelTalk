const fs = require('fs');
const path = require('path');
const directory = path.resolve(__dirname, '../src/modules');
const names = ['uniquePictures.json', ...fs.readdirSync(directory).filter(name => /^uniquePictures\.part-\d+\.json$/.test(name)).sort()];
module.exports = Object.assign({}, ...names.map(name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))));
