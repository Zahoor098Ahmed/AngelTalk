const { execSync } = require('child_process');

console.log('--- 22294de BACKLOG diff ---');
try {
  console.log(execSync('git diff 22294de~1 22294de -- BACKLOG.md').toString());
} catch(e) { console.log(e.message); }

console.log('--- 879fd61 BACKLOG diff ---');
try {
  console.log(execSync('git diff 879fd61~1 879fd61 -- BACKLOG.md').toString());
} catch(e) { console.log(e.message); }
