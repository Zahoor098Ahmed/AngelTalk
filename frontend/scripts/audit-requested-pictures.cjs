const fs = require('fs'), path = require('path');
const ts = require('../node_modules/typescript');
const root = path.resolve(__dirname, '../src/modules');
const req = require('module').createRequire(path.join(root, 'uniquePictures.ts'));
function load(name) {
  const result = {};
  new Function('require', 'exports', ts.transpile(fs.readFileSync(path.join(root, name+'.ts'), 'utf8'), {module:ts.ModuleKind.CommonJS}))(req, result);
  return result;
}
const pictures = load('uniquePictures').default;
const names = ['tiara','large','scratchy','silky','empty','slow','bottom','therapy ball','christmas','engagement','fasting','seder plate',"st. patrick's day",'stocking','suhoor','thanksgiving','airport','cafeteria','castle','community','kindergarten','sensory room','train station','canadian dollar','pay cheque','easel','glue','glue stick','paper clamp','thumbtack','water cooler','telephone book'];
const out = path.resolve(__dirname,'../assets/image-edits/requested-cleanup');
fs.mkdirSync(out,{recursive:true});
const priorFile=path.join(out,'audit.json');
const prior=new Map(fs.existsSync(priorFile)?JSON.parse(fs.readFileSync(priorFile,'utf8')).map(row=>[row.word,row]):[]);
const rows=[];
for(const word of new Set(names.map(w=>w.toLowerCase()))) {
  const saved=prior.get(word);
  if(saved?.file && fs.existsSync(path.join(out,saved.file))) {rows.push(saved);continue;}
  const uri=pictures[word];
  const slug=word.replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
  if(!uri?.startsWith('data:')) {rows.push({word,slug,uri});continue;}
  const mime=uri.slice(5,uri.indexOf(';'));
  const ext=mime==='image/png'?'png':mime==='image/svg+xml'?'svg':'jpg';
  const file=slug+'-original.'+ext;
  fs.writeFileSync(path.join(out,file),Buffer.from(uri.split(',')[1],'base64'));
  rows.push({word,slug,file,mime,bytes:Buffer.byteLength(uri),aliases:Object.keys(pictures).filter(key=>pictures[key]===uri)});
}
fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(rows,null,2)+'\n');
console.log(rows.map(r=>({word:r.word,file:r.file,uri:r.uri?.slice(0,100)})));
