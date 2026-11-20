const fs = require('fs');
const assert = require('node:assert/strict');
const ts = require('../node_modules/typescript');
const source = fs.readFileSync('frontend/src/modules/normalizeWordImage.ts', 'utf8');
const compiled = ts.transpile(source + '\nexport { sharpenRaster };', {module:ts.ModuleKind.CommonJS});
const exportsForTest = {};
new Function('require','exports',compiled)(()=>({}),exportsForTest);

function sharpen(color) {
  const width=7, data=new Uint8ClampedArray(width*width*4);
  for(let i=0;i<data.length;i+=4)data.set([128,128,128,255],i);
  const center=(3*width+3)*4;
  data.set([...color,255],center);
  const before=data.slice();
  const ctx={getImageData:()=>({data}),putImageData:image=>data.set(image.data)};
  exportsForTest.sharpenRaster(ctx,width,width,1);
  return {data,before,center};
}
for(const color of [[220,45,45],[245,165,165],[180,75,65]]) {
  const {data,before,center}=sharpen(color);
  for(const offset of [0,-4,4,-28,28]) {
    assert.deepEqual(data.slice(center+offset,center+offset+4),before.slice(center+offset,center+offset+4),'Red and its boundary must remain soft');
  }
}
const blue=sharpen([45,75,210]);
assert.notDeepEqual(blue.data,blue.before,'Non-red detail should still gain clarity');
const deltas=[0,1,2].map(channel=>blue.data[blue.center+channel]-blue.before[blue.center+channel]);
assert.equal(deltas[0],deltas[1],'Clarity must preserve the difference between red and green');
assert.equal(deltas[1],deltas[2],'Clarity must preserve the difference between green and blue');
for(let i=0;i<blue.data.length;i++)assert.ok(Math.abs(blue.data[i]-blue.before[i])<=18,'Sharpening must stay gentle');
const flat=sharpen([128,128,128]);
assert.deepEqual(flat.data,flat.before,'Flat colors must remain unchanged');
console.log('PASS: red and pink areas and their edges stay soft; other edges gain gentle clarity; flat colors remain unchanged.');
