const { execSync } = require('child_process');
const fs = require('fs');

const commits = [
  '78a60fb',
  '42d47ba',
  'f2b2ad5',
  'a46bb6a',
  'daf1e1e',
  '22294de',
  '879fd61',
  'cbfd898'
];

for (const c of commits) {
  try {
    // Just extract the line containing "apple": "
    // Using git grep or powershell git show
    const out = execSync(`git show ${c}:frontend/src/modules/uniquePictures.json | powershell -Command "$input | Select-String -Pattern '\\\"apple\\\":' | Select-Object -First 1"`).toString();
    console.log(`${c}: apple len = ${out.trim().length}`);
  } catch(e) {
    console.log(`${c}: error ${e.message}`);
  }
}
