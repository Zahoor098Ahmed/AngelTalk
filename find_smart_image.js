const fs = require('fs');
const path = require('path');

function search(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') search(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('SmartImage') || content.includes('data:image/svg+xml') || content.includes('teddy') || content.includes('bear')) {
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('SmartImage') || l.includes('teddy') || l.includes('bear')) {
            console.log(`${full}:${idx+1}: ${l.slice(0, 100)}`);
          }
        });
      }
    }
  });
}
search('./frontend/src');

