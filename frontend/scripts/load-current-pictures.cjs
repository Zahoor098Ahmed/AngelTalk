const fs=require('fs'),path=require('path'),ts=require('../node_modules/typescript');
const root=path.resolve(__dirname,'../src/modules'),cache=new Map();
function load(request){
  let file=request;
  if(!path.extname(file))file+=fs.existsSync(file+'.ts')?'.ts':'.json';
  if(cache.has(file))return cache.get(file);
  if(file.endsWith('.json')){const data=JSON.parse(fs.readFileSync(file,'utf8'));cache.set(file,data);return data;}
  const result={};cache.set(file,result);
  new Function('require','exports',ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}))(id=>{
    if(!id.startsWith('.'))throw Error('Unexpected picture dependency: '+id);
    return load(path.resolve(path.dirname(file),id));
  },result);return result;
}
module.exports=load(path.join(root,'uniquePictures.ts')).default;
