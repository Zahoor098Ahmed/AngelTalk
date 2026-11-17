const { execSync } = require('child_process');
const fs = require('fs');

// Check commit 22294de vs 22294de~1
const showStat = execSync('git show --stat 22294de').toString();
console.log('22294de stat:\n', showStat);

const showPrev = execSync('git show --stat daf1e1e').toString();
console.log('daf1e1e stat:\n', showPrev);
