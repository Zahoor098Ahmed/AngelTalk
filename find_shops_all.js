const fs = require('fs');
const path = require('path');

function searchAll(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') searchAll(full);
    } else if (f.endsWith('.json') || f.endsWith('.ts') || f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('"shops"') || content.includes("'shops'")) {
        console.log(`Found in: ${full}`);
      }
    }
  });
}
searchAll('./frontend/src');

