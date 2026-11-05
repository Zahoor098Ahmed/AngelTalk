const fs = require('fs');
const path = require('path');

function searchFiles(dir, term) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') searchFiles(full, term);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.toLowerCase().includes(term)) {
        console.log("Match in:", full);
      }
    }
  }
}

searchFiles('./frontend/src', 'fallback');
searchFiles('./frontend/src', 'placeholder');
searchFiles('./frontend/src', 'toys and leisure items');

