const fs = require('fs');
const mods = fs.readdirSync('./frontend/node_modules');
console.log(mods.filter(m => m.includes('jpeg') || m.includes('image') || m.includes('png') || m.includes('svg') || m.includes('pixel') || m.includes('color')));

