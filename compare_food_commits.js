const { execSync } = require('child_process');
const fs = require('fs');

const sampleWords = ['bread', 'apple', 'banana', 'burger', 'milk', 'pizza', 'cheese', 'egg', 'rice', 'chicken'];

const commits = ['HEAD', '22294de~1', '78a60fb', 'f67262b'];

for (const commit of commits) {
  console.log(`\n=== Commit: ${commit} ===`);
  try {
    const raw = execSync(`git show ${commit}:frontend/src/modules/uniquePictures.json`, { maxBuffer: 50 * 1024 * 1024 }).toString();
    const json = JSON.parse(raw);
    for (const w of sampleWords) {
      const val = json[w] || json['food and drinks::' + w];
      const type = val ? (val.startsWith('data:image/jpeg') ? 'JPEG' : val.startsWith('data:image/png') ? 'PNG' : val.slice(0, 20)) : 'none';
      const len = val ? val.length : 0;
      console.log(`  ${w}: ${type} (len: ${len})`);
    }
  } catch(e) {
    console.log('Error reading commit', commit, e.message);
  }
}
