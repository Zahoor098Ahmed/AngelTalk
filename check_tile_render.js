const fs = require('fs');

const aac = fs.readFileSync('./frontend/src/screens/AACBoardScreen.tsx', 'utf8');
const lines = aac.split('\n');

for (let i = 1270; i < 1360; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

