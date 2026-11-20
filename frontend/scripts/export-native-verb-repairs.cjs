const fs=require('fs'),path=require('path'),ts=require('../node_modules/typescript');
const root=path.resolve(__dirname,'../src/modules'),cache={};
function load(name){if(cache[name])return cache[name];const result={};cache[name]=result;new Function('require','exports',ts.transpile(fs.readFileSync(path.join(root,name+'.ts'),'utf8'),{module:ts.ModuleKind.CommonJS}))(id=>load(id.replace('./','')),result);return result;}
const pictures=load('nativeVerbBodyRepairs').default;
const assets=path.resolve(__dirname,'../assets/image-edits/verbs-b-z');
const rows=JSON.parse(fs.readFileSync(path.join(assets,'manifest.json'),'utf8')).filter(row=>row.status==='native-vector');
const result={};for(const row of rows){if(!pictures[row.key])throw Error('Missing native repair: '+row.key);result[row.key]=pictures[row.key];}
fs.writeFileSync(path.join(assets,'native-updated.json'),JSON.stringify(result)+'\n');
const html='<!doctype html><meta charset="utf-8"><style>body{margin:12px;background:#e8eef2;font:14px Arial;display:grid;grid-template-columns:repeat(6,1fr);gap:10px}figure{margin:0;background:white;border:1px solid #cbd5e1;border-radius:10px;text-align:center;padding:8px}img{width:100%;height:180px;object-fit:contain}figcaption{padding:8px 0;font-weight:bold}</style>'+Object.entries(result).map(([key,uri])=>'<figure><img src="'+uri+'"><figcaption>'+key+'</figcaption></figure>').join('');
fs.writeFileSync(path.join(assets,'native-preview.html'),html);
console.log('Exported',rows.length,'complete vector verb pictures.');
