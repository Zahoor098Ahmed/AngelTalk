const fs = require('fs');
const ts = require('../node_modules/typescript');
const dir = 'frontend/assets/image-audit';
const remote = process.argv.includes('--remote');
const prefix = remote ? 'remote-sizing' : 'sizing';
const root = 'frontend/src/modules/';
const compile = name => ts.transpile(fs.readFileSync(root + name + '.ts', 'utf8'), { module: ts.ModuleKind.CommonJS });
const bounds = compile('imageContentBounds');
const normalize = compile('normalizeWordImage');
const pictures = JSON.parse(fs.readFileSync(root + 'uniquePictures.json', 'utf8'));
const embedded = Object.entries(pictures).filter(([, uri]) => remote ? uri.startsWith('http') : uri.startsWith('data:'));
fs.writeFileSync(dir + '/' + prefix + '-data.js', 'window.auditPictures=' + JSON.stringify(embedded) + ';');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;background:#eef2f6}#samples{display:flex;flex-wrap:wrap;gap:12px}figure{background:white;margin:0;padding:0;text-align:center;overflow:hidden;border-radius:16px}img{width:260px;height:260px;object-fit:cover}figcaption{font-weight:bold}</style></head><body><pre id="result">RUNNING</pre><div id="samples"></div><script src="${prefix}-data.js"></script><script>
const boundsModule={exports:{}};(function(exports){${bounds}})(boundsModule.exports);
const normalizeModule={exports:{}};(function(exports,require){${normalize}})(normalizeModule.exports,()=>boundsModule.exports);
(async()=>{const rows=window.auditPictures;let passed=0;const failures=[];const sampleWords=['naan','paratha','pastry','pita bread','roll-sandwich','roti'];
for(let start=0;start<rows.length;start+=24){await Promise.all(rows.slice(start,start+24).map(async([word,uri])=>{const result=await normalizeModule.exports.normalizeWordImage(uri);if(result===uri){failures.push(word);return;}const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=result;});if(Math.max(img.naturalWidth,img.naturalHeight)!==256||Math.min(img.naturalWidth,img.naturalHeight)<1){failures.push(word+':size');return;}passed++;if(sampleWords.includes(word)){const figure=document.createElement('figure');img.style.width='260px';img.style.height='260px';figure.append(img);const label=document.createElement('figcaption');label.textContent=word;figure.append(label);document.getElementById('samples').append(figure);}}));}
document.getElementById('result').textContent=JSON.stringify({total:rows.length,passed,failures});document.title='COMPLETE';})().catch(e=>document.getElementById('result').textContent='ERROR '+e.stack);
</script></body></html>`;
fs.writeFileSync(dir + '/' + prefix + '-review.html', html);
console.log('Prepared browser audit of', embedded.length, 'embedded pictures.');

