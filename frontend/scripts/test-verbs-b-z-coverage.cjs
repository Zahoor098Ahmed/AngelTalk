const fs=require('fs'),assert=require('node:assert/strict');
const pictures=require('./load-current-pictures.cjs');
const rows=JSON.parse(fs.readFileSync('frontend/assets/image-edits/verbs-b-z/manifest.json','utf8'));
const coverage=JSON.parse(fs.readFileSync('frontend/assets/image-edits/verbs-b-z/coverage.json','utf8'));
assert.equal(coverage.ready,rows.length,'Every B-Z action must be restored');
assert.deepEqual(coverage.missing,[],'No verb may be silently skipped');
let labels=0;
for(const row of rows){
  const image=pictures[row.key];
  assert.ok(image?.startsWith('data:image/'),'Missing bundled HD picture: '+row.key);
  for(const label of row.tileLabels){assert.equal(pictures[row.folder+'::'+label],image,'A verb form points at an older picture: '+label);labels++;}
}
console.log(`PASS: ${rows.length} B-Z actions and ${labels} form labels resolve to their current bundled pictures.`);
