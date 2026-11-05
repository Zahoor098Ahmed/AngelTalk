const fs = require('fs');
const path = require('path');

function findImages(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') findImages(full);
    } else if (/\.(png|jpg|jpeg|svg|webp)$/i.test(f)) {
      console.log(full);
    }
  });
}
findImages('./frontend');

