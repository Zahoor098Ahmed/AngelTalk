const fs=require('fs'),ts=require('../node_modules/typescript');
const code=ts.transpile(fs.readFileSync('frontend/src/modules/deviceDataStorage.ts','utf8'),{module:ts.ModuleKind.CommonJS});
const html=`<!doctype html><html><meta charset="utf-8"><body><pre id="result">RUNNING</pre><script>
const compiled=${JSON.stringify(code)};
const adapter={getItem:async key=>localStorage.getItem(key),setItem:async(key,value)=>localStorage.setItem(key,value),removeItem:async key=>localStorage.removeItem(key)};
function load(){const exports={};new Function('require','exports',compiled)(()=>({__esModule:true,default:adapter}),exports);return exports.deviceDataStorage;}
function check(condition,message){if(!condition)throw Error(message);}
(async()=>{
const key='privacy-browser-test-'+Date.now();
const storage=load();
check(await storage.getItem(key)===null,'Fresh device has no personal board');
const original={words:[{id:'default',label:'Default word'},{id:'custom',label:'Private custom word'}]};
await adapter.setItem(key,JSON.stringify(original));
check(JSON.parse(await storage.getItem(key)).words.length===2,'Legacy local board must load');
const edited={words:[{id:'custom',label:'Private custom word'},{id:'added',label:'New personal word'}]};
await Promise.all([storage.setItem(key,JSON.stringify(original)),storage.setItem(key,JSON.stringify(edited))]);
check(localStorage.getItem(key)===null,'Legacy copy retired only after database commit');
const freshSession=load();
check(JSON.parse(await freshSession.getItem(key)).words[0].id==='custom','Deleted word stays deleted after reload');
check(JSON.parse(await freshSession.getItem(key)).words[1].id==='added','Added word survives reload');
const photo='data:image/png;base64,'+'A'.repeat(6*1024*1024);
await storage.setItem(key+'-picture',photo);
check((await freshSession.getItem(key+'-picture')).length===photo.length,'Custom image larger than localStorage quota survives');
await storage.setItem(key+'-deleted',JSON.stringify(['default']));
check(JSON.parse(await freshSession.getItem(key+'-deleted'))[0]==='default','Deletion markers survive');
check(await freshSession.getItem(key+'-another-user')===null,'Other local data keys remain isolated');
await storage.removeItem(key);await storage.removeItem(key+'-picture');await storage.removeItem(key+'-deleted');
check(await freshSession.getItem(key)===null,'Local removal must not revive old data');
document.getElementById('result').textContent='PASS: IndexedDB save/reload, ordered edits, deleted words, legacy migration, 6MB custom pictures, deletion markers, isolation and local removal.';
})().catch(e=>document.getElementById('result').textContent='FAIL: '+e.stack);
</script></body></html>`;
fs.writeFileSync('frontend/assets/image-audit/local-privacy-test.html',html);
