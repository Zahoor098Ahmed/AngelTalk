const fs = require('fs');
const assert = require('node:assert/strict');
const ts = require('../node_modules/typescript');
function loadModule(name, mocks) {
  const exports = {};
  const source = fs.readFileSync('frontend/src/modules/'+name+'.ts','utf8');
  const compiled = ts.transpile(source,{ module: ts.ModuleKind.CommonJS });
  new Function('require','exports',compiled)((id) => {
    if (!(id in mocks)) throw Error('Unexpected dependency: '+id);
    return mocks[id];
  },exports);
  return exports;
}
(async () => {
  const unique = require('../src/modules/uniquePictures.json');
  const home = require('../src/modules/homeCategoryPictures.json');
  const codec = loadModule('localBoardCodec',{'./uniquePictures.json':{__esModule:true,default:unique},'./homeCategoryPictures.json':{__esModule:true,default:home}});
  const customPicture='data:image/png;base64,CUSTOM_LOCAL_PICTURE';
  const board=[{id:'food',name:'Food',words:[{id:'bake',label:'Bake',imageUri:unique.bake},{id:'my-word',label:'My private word',imageUri:customPicture}]}];
  const raw=codec.serializeLocalBoard(board);
  assert.deepEqual(codec.parseLocalBoard(raw),board);
  assert.deepEqual(codec.parseLocalBoard(JSON.stringify(board)),board);
  assert.ok(raw.length<JSON.stringify(board).length/5,'Built-in images should not be duplicated in local saves');
  const values=new Map();
  const asyncStorage={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{values.set(k,v);},removeItem:async k=>{values.delete(k);}};
  const mocks={'@react-native-async-storage/async-storage':{__esModule:true,default:asyncStorage}};
  const local=loadModule('deviceDataStorage',mocks).deviceDataStorage;
  assert.equal(await local.getItem('new-install'),null);
  await local.setItem('board',raw);
  const changed=codec.parseLocalBoard(await local.getItem('board'));
  changed[0].words=changed[0].words.filter(w=>w.id!=='bake');
  changed[0].words.push({id:'added',label:'Added on this device'});
  await Promise.all([local.setItem('board','old pending save'),local.setItem('board',codec.serializeLocalBoard(changed))]);
  const reloaded=loadModule('deviceDataStorage',mocks).deviceDataStorage;
  assert.deepEqual(codec.parseLocalBoard(await reloaded.getItem('board')),changed,'Edits must survive a new module/session');
  assert.equal(await reloaded.getItem('other-device-board'),null);
  await reloaded.setItem('deleted-words',JSON.stringify(['bake']));
  assert.deepEqual(JSON.parse(await reloaded.getItem('deleted-words')),['bake']);
  const child={id:'child1',name:'Ayaan',age:5,diagnoses:['general'],photoUrl:'data:image/png;base64,LOCAL_FACE',settings:{customWords:['SECRET']},careLogs:[{notes:'SECRET'}],stars:4};
  const profiles=loadModule('cloudProfiles',{});
  const records=profiles.buildProfileRecords([child]);
  assert.deepEqual(records,[{key:'children:child1',table:'children',id:'child1',data:{name:'Ayaan',age:5,diagnoses:['general']}}]);
  assert.ok(!JSON.stringify(records).includes('SECRET'));
  const requests=[];
  const legacySent={'words:private-word':'hash','shelves:private-folder':'hash'};
  values.set('angeltalk_cloud_sent',JSON.stringify(legacySent));
  const backend={getAccessToken:async()=> 'token',checkServerHealth:async()=>true,authFetch:async(endpoint,options)=>{
    requests.push({endpoint,body:options?.body?JSON.parse(options.body):null});
    return {ok:true,json:async()=>endpoint.includes('/content/')?{data:{syncedAt:'2026-11-16T00:00:00Z',templates:[],verbs:[]}}:{data:{results:[{id:'child1',status:'applied'}]}}};
  }};
  const cloudModule=loadModule('cloudConnect',{
    '@react-native-async-storage/async-storage':{__esModule:true,default:asyncStorage},'./backendSync':backend,
    './customCategories':{ensureCategoriesLoaded:async()=>{},listCategories:()=>{throw Error('Private board must not be read by cloud sync');}},
    './storage':{loadChildren:()=>[child]},'./cloudProfiles':profiles,
    './i18n':{canonicalWordEn:s=>s},'./verbForms':{},
  });
  await cloudModule.syncNow();
  child.careLogs.push({notes:'SECOND_PRIVATE_NOTE'});
  await cloudModule.syncNow();
  const pushes=requests.filter(r=>r.endpoint.includes('/sync/push'));
  assert.equal(pushes.length,1,'Private content changes must not create cloud mutations');
  assert.deepEqual(pushes[0].body.mutations.map(m=>m.table),['children']);
  assert.ok(!JSON.stringify(requests).includes('SECRET'));
  assert.ok(!JSON.stringify(requests).includes('private-word'));
  assert.ok(!requests.some(r=>r.endpoint.includes('/sync/pull')));
  console.log('PASS: local add/delete and deletion markers survive reload; writes remain ordered; legacy boards load; built-in images compact; custom pictures preserved; only profiles upload; old board tombstones never upload.');
})().catch(error=>{console.error(error);process.exitCode=1;});
