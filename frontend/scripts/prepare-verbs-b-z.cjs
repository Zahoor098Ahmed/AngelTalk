const fs=require('fs'),path=require('path'),ts=require('../node_modules/typescript');
const root=path.resolve(__dirname,'../src/modules'),out=path.resolve(__dirname,'../assets/image-edits/verbs-b-z');
fs.mkdirSync(out,{recursive:true});
const cache=new Map(),mocks={};
function load(name){
  if(name in mocks)return mocks[name];
  if(cache.has(name))return cache.get(name);
  const json=path.join(root,name.replace(/^\.\//,'')+'.json');
  if(fs.existsSync(json)&&!fs.existsSync(path.join(root,name.replace(/^\.\//,'')+'.ts'))){const value=JSON.parse(fs.readFileSync(json,'utf8'));cache.set(name,value);return value;}
  const file=path.join(root,name.replace(/^\.\//,'')+'.ts'),result={};cache.set(name,result);
  const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020});
  new Function('require','exports',code)(id=>{
    if(id in mocks)return mocks[id];
    if(id.endsWith('.json'))return JSON.parse(fs.readFileSync(path.join(root,id),'utf8'));
    return load(id);
  },result);return result;
}
const pictures=load('./uniquePictures').default;
const dict=JSON.parse(fs.readFileSync(path.join(root,'arasaacDict.json'),'utf8'));
mocks['./imageLibrary']={dictUrl:word=>dict[word.toLowerCase()]?`https://static.arasaac.org/pictograms/${dict[word.toLowerCase()]}/${dict[word.toLowerCase()]}_500.png`:null};
const aac=load('./aacPictograms');
const data=new Map();
mocks['./deviceDataStorage']={deviceDataStorage:{getItem:async key=>data.get(key)||null,setItem:async(key,value)=>{data.set(key,value);},removeItem:async key=>{data.delete(key);}}};
mocks['./i18n']={starterLabel:s=>s,wordLabel:s=>s,canonicalWordEn:s=>s,translateDynamic:async s=>s};
const board=load('./customCategories');
(async()=>{
  await board.ensureCategoriesLoaded();
  const found=new Map();
  for(const category of board.listCategories()){
    const folder=(category.seedName||category.name).toLowerCase();
    if(!/^verb [b-z]$/.test(folder))continue;
    for(const tile of category.words){
      const word=(tile.verbForms?.base||tile.seedLabel||tile.label).toLowerCase();
      const key=folder+'::'+word;
      if(found.has(key)){found.get(key).tileLabels.push(tile.label.toLowerCase());continue;}
      const uri=pictures[key]||pictures[word]||tile.imageUri||aac.getPictogramUrl(word);
      const slug=(folder+'-'+word).replace(/[^a-z0-9]+/g,'-');
      const row={key,folder,word,slug,tileLabels:[tile.label.toLowerCase()],source:uri};found.set(key,row);
    }
  }
  const rows=[];
  for(const row of found.values()){
    const uri=row.source;delete row.source;
    if(!uri){row.status='missing';rows.push(row);continue;}
    if(uri.startsWith('data:image/svg+xml')){
      row.status='native-vector';row.original=row.slug+'-original.svg';
      fs.writeFileSync(path.join(out,row.original),uri.includes(';base64,')?Buffer.from(uri.split(',')[1],'base64'):decodeURIComponent(uri.slice(uri.indexOf(',')+1)));
    }else if(uri.startsWith('data:')){
      row.status='raster';row.original=row.slug+'-original.'+(uri.includes('image/png')?'png':'jpg');
      if(!fs.existsSync(path.join(out,row.original)))fs.writeFileSync(path.join(out,row.original),Buffer.from(uri.split(',')[1],'base64'));
    }else{row.status='remote';row.url=uri;}
    row.tileLabels=[...new Set(row.tileLabels)];rows.push(row);
  }
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(rows,null,2)+'\n');
  const summary={words:rows.length,tiles:rows.reduce((sum,r)=>sum+r.tileLabels.length,0),byKind:{},byLetter:{}};
  for(const row of rows){summary.byKind[row.status]=(summary.byKind[row.status]||0)+1;summary.byLetter[row.folder]=(summary.byLetter[row.folder]||0)+1;}
  fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
})().catch(error=>{console.error(error);process.exitCode=1;});
