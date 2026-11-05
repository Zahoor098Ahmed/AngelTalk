const fs = require('fs');

const aac = fs.readFileSync('./frontend/src/screens/AACBoardScreen.tsx', 'utf8');

// Look for image source or fallback in AACBoardScreen
const lines = aac.split('\n');
lines.forEach((l, i) => {
  if (l.includes('getImage') || l.includes('imageUri') || l.includes('source=') || l.includes('uniquePictures') || l.includes('toys')) {
    console.log(`${i+1}: ${l.slice(0, 100)}`);
  }
});

