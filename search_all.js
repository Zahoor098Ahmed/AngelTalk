const fs = require('fs');
const path = require('path');

function searchAll(dir, words) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') searchAll(full, words);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json')) {
      if (f === 'uniquePictures.json') return;
      const content = fs.readFileSync(full, 'utf8');
      words.forEach(w => {
        if (content.toLowerCase().includes(w)) {
          console.log(`Found "${w}" in ${full}`);
        }
      });
    }
  });
}

searchAll('./frontend/src', ['gazebo', 'picnic']);

