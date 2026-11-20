const fs=require('fs'),path=require('path'),ts=require('../node_modules/typescript');
const modules=path.resolve(__dirname,'../src/modules');
const requireHere=require('module').createRequire(path.join(modules,'uniquePictures.ts'));
const output={};
new Function('require','exports',ts.transpile(fs.readFileSync(path.join(modules,'uniquePictures.ts'),'utf8'),{module:ts.ModuleKind.CommonJS}))(requireHere,output);
const pictures=output.default;
const groups={
  preposition:['about','across','against','at','beneath','by','for','inside','opposite','outside','with','without'],
  pronouns:['he','her','hers','herself','him','himself','his','i','me','mine','my','myself','our','ours','ourselves','she','that','their','theirs','them','themselves','they','us','we','whom','you','your','yours','yourself','yourselves'],
  school:['assembly','class','dramatic play','fire drill','gross motor','gross motor game','gym','music class','pe','reading','show and tell','story time','crafts'],
  'verb a':['act','agree','aim','answer','appear','approach','arrive','ask','assist','attempt','attend','avoid'],
};
const directory=path.resolve(__dirname,'../assets/image-edits/people-complete');
fs.mkdirSync(directory,{recursive:true});
const rows=[];
for(const [folder,words] of Object.entries(groups))for(const word of words){
  const key=folder+'::'+word,uri=pictures[key]||pictures[word];
  if(!uri?.startsWith('data:'))throw Error('Missing bundled original: '+key);
  const slug=(folder+'-'+word).replace(/[^a-z0-9]+/g,'-');
  const extension=uri.includes('image/png')?'png':'jpg';
  const original=slug+'-original.'+extension;
  if(!fs.existsSync(path.join(directory,original)))fs.writeFileSync(path.join(directory,original),Buffer.from(uri.split(',')[1],'base64'));
  const aliases=Object.keys(pictures).filter(name=>pictures[name]===uri);
  rows.push({key,folder,word,slug,original,aliases,removeHearts:true});
}
fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(rows,null,2)+'\n');
console.log('Prepared',rows.length,'original people pictures.');
