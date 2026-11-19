const fs=require('fs'),ts=require('../node_modules/typescript'),assert=require('node:assert/strict');
function load(name,mocks={}){const result={};new Function('require','exports',ts.transpile(fs.readFileSync('frontend/src/modules/'+name+'.ts','utf8'),{module:ts.ModuleKind.CommonJS}))(id=>{if(!(id in mocks))throw Error('Unexpected import '+id);return mocks[id];},result);return result;}
const unique=Object.assign({},require('./load-word-pictures.cjs'),require('../src/modules/kitchenPictureReplacements.json'));
const home=require('../src/modules/homeCategoryPictures.json');
const codec=load('localBoardCodec',{'./uniquePictures':unique,'./homeCategoryPictures.json':home});
const verbs=load('verbForms');
const vocabulary=load('clientVocabulary');
const pecs=load('pecsVocabulary');
function boardSession(data){const local={getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{data.set(k,v);},removeItem:async k=>{data.delete(k);}};return load('customCategories',{
'./deviceDataStorage':{deviceDataStorage:local},'./localBoardCodec':codec,
'./i18n':{starterLabel:s=>s,wordLabel:s=>s,canonicalWordEn:s=>s,translateDynamic:async s=>s},
'./aacPictograms':{getPictogramUrl:s=>unique[s.toLowerCase()]||null,isOneWordGuess:()=>false,pictureFixFor:()=>undefined,hasSymbolPicture:s=>!!unique[s.toLowerCase()]},
'./verbForms':verbs,'./pecsEmoji.json':require('../src/modules/pecsEmoji.json'),
'./uniquePictures':unique,'./homeCategoryPictures.json':home,'./clientVocabulary':vocabulary,'./pecsVocabulary':pecs,
});}
const snapshot=board=>board.listCategories().map(c=>({name:c.name,words:c.words.map(w=>w.label).sort()})).sort((a,b)=>a.name.localeCompare(b.name));
(async()=>{
const deviceOne=new Map(),deviceTwo=new Map();
const first=boardSession(deviceOne);await first.ensureCategoriesLoaded();const defaults=snapshot(first);
assert.ok(defaults.length>20,'New installs should receive the complete bundled board');
const folder=first.listCategories().find(c=>c.words.length>3);
const removed=folder.words[0];
first.removeWord(folder.id,removed.id);
first.addWord(folder.id,{label:'My private snack xyz',imageUri:'data:image/png;base64,PRIVATE_LOCAL',isCustom:true});
const next=boardSession(deviceOne);await next.ensureCategoriesLoaded();
const reloaded=next.listCategories().find(c=>c.id===folder.id);
assert.ok(reloaded.words.some(w=>w.label==='My private snack xyz'),'Added personal word should survive startup migrations');
assert.ok(!reloaded.words.some(w=>w.id===removed.id||w.label===removed.label),'Deleted built-in word should not be reseeded');
const second=boardSession(deviceTwo);await second.ensureCategoriesLoaded();assert.deepEqual(snapshot(second),defaults,'Another device should receive the defaults, without the first device edits');
const boardKey='kiddocare_custom_categories_wordfile_v6';
const legacy=codec.parseLocalBoard(deviceTwo.get(boardKey));
const oldKitchen=legacy.find(c=>(c.seedName||c.name)==='Kitchen');
const oldPot=oldKitchen.words.find(w=>w.label==='Pots');
assert.ok(oldPot,'Kitchen must include Pots');
oldPot.label='Pot';oldPot.seedLabel='Pot';oldPot.phrase='Pot';oldPot.useCount=7;oldPot.audioUri='local-pot-recording';
oldKitchen.words=oldKitchen.words.filter(w=>w.label!=='Pans');
deviceTwo.set(boardKey,codec.serializeLocalBoard(legacy));
deviceTwo.set('kiddocare_deleted_items_wordfile_v6',JSON.stringify([`word::${oldKitchen.id}::pans`]));
deviceTwo.delete('kiddocare_restored_kitchen_cookware_v1');
const updated=boardSession(deviceTwo);await updated.ensureCategoriesLoaded();
const kitchen=updated.listCategories().find(c=>c.id===oldKitchen.id);
const pots=kitchen.words.filter(w=>w.label==='Pots');
assert.equal(pots.length,1);assert.equal(pots[0].id,oldPot.id);assert.equal(pots[0].useCount,7);assert.equal(pots[0].audioUri,'local-pot-recording');
assert.equal(kitchen.words.filter(w=>w.label==='Pans').length,1,'Pans must return as a separate tile');
assert.ok(!kitchen.words.some(w=>w.label==='Pot'),'The old singular built-in tile should be renamed');
for(const word of ['bread bin','espresso cup','measuring spoons','rice cooker','spray bottle']){
  assert.equal(kitchen.words.find(w=>w.label.toLowerCase()===word)?.imageUri,unique['kitchen::'+word]||unique[word],word+' must use its current bundled picture');
}
for(const root of next.topLevelCategories())next.deleteCategoryDeep(root.id);
const empty=boardSession(deviceOne);await empty.ensureCategoriesLoaded();assert.equal(empty.listCategories().length,0,'Deleting the entire board should not recreate it on reload');
console.log('PASS: complete default board on new devices; personal additions/deletions survive real board reload and migrations; another device keeps defaults; intentionally empty boards stay empty.');
})().catch(error=>{console.error(error);process.exitCode=1;});
