const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('../node_modules/typescript');
function compile(file,mocks){const exports={};new Function('require','exports',ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS}))(id=>{if(!(id in mocks))throw Error('Unexpected import '+id+' in '+file);return mocks[id];},exports);return exports;}
const aesRoot=path.resolve('frontend/node_modules/expo-crypto/src/aes'),aesCache=new Map();
function aesModule(name){if(aesCache.has(name))return aesCache.get(name);const mocks={};if(name==='ExpoCryptoAES.web')mocks.expo={NativeModule:class{},CodedError:class extends Error{},registerWebModule:Constructor=>new Constructor()};for(const item of ['aes.types','web-utils'])if(item!==name)mocks['./'+item]=()=>aesModule(item);if(name==='index')mocks['./ExpoCryptoAES']=()=>aesModule('ExpoCryptoAES.web');const result={};new Function('require','exports',ts.transpile(fs.readFileSync(path.join(aesRoot,name+'.ts'),'utf8'),{module:ts.ModuleKind.CommonJS}))(id=>{const value=mocks[id];if(!value)throw Error('Unexpected AES import '+id);return typeof value==='function'?value():value;},result);aesCache.set(name,result);return result;}
const expoCrypto={...aesModule('index'),CryptoDigestAlgorithm:{SHA256:'SHA-256'},digestStringAsync:async(_algorithm,text)=>crypto.createHash('sha256').update(text).digest('hex')};
const cryptography=compile('frontend/src/modules/backupCrypto.ts',{'expo-crypto':expoCrypto});
const time=compile('frontend/src/modules/backupTime.ts',{});
(async()=>{
const code=await cryptography.newRecoveryCode();assert.equal(code.length,64);assert.equal(cryptography.normalizeRecoveryCode(cryptography.formatRecoveryCode(code)),code);
const identity=await cryptography.backupIdentity(code);assert.equal(identity.id,crypto.createHash('sha256').update(identity.proof).digest('hex'));
const text=JSON.stringify({words:['PRIVATE_WORD','اردو','عربي'],categories:['PRIVATE_CATEGORY']});
const sealed=await cryptography.encryptBackupPayload(text,code);assert.equal(await cryptography.decryptBackupPayload(sealed,code),text);assert.notEqual(await cryptography.encryptBackupPayload(text,code),sealed);
await assert.rejects(()=>cryptography.decryptBackupPayload(sealed,code==='a'.repeat(64)?'b'.repeat(64):'a'.repeat(64)));
const damaged=Buffer.from(sealed,'base64');damaged[damaged.length-1]^=1;await assert.rejects(()=>cryptography.decryptBackupPayload(damaged.toString('base64'),code));assert.throws(()=>cryptography.normalizeRecoveryCode('1234'));
for(const [zone,now,expected] of [['Asia/Karachi','2026-11-16T18:59:59Z','2026-11-16T19:00:00.000Z'],['America/New_York','2026-03-08T05:00:00Z','2026-03-09T04:00:00.000Z']])assert.equal(time.nextLocalMidnight(new Date(now),zone).toISOString(),expected);
const values=new Map(),database=new Map(),secure=new Map(),files=new Map();
const image='file:///old-device/custom.webp',audio='file:///old-device/voice.mp3';files.set(image,Buffer.from('private picture').toString('base64'));files.set(audio,Buffer.from('private audio').toString('base64'));
const board=[{id:'food',name:'Private foods',words:[{id:'my-word',label:'PRIVATE_WORD',imageUri:image,audioUri:audio}]}];
values.set('kiddocare_children',JSON.stringify([{id:'child',name:'Ayaan',photoUrl:image}]));values.set('kiddocare_settings',JSON.stringify({language:'en-US',speechRate:0.8}));values.set('kiddocare_usage',JSON.stringify({privateWordCount:12}));values.set('kiddocare_deleted_items_wordfile_v6',JSON.stringify(['word::food::bread']));values.set('angeltalk_cloud_account',JSON.stringify({email:'original-family@test.com',password:'original-private-password'}));values.set('angeltalk_access_token','AUTH_TOKEN_NOT_IN_BACKUP');
let failKey;
const asyncStorage={getAllKeys:async()=>[...values.keys()],getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{if(key===failKey){failKey=undefined;throw Error('Simulated local storage failure');}values.set(key,value);},removeItem:async key=>{values.delete(key);}};
const localStorage={getDatabaseKeys:async()=>[...database.keys()],getItem:async key=>database.get(key)??values.get(key)??null,setItem:async(key,value)=>{database.set(key,value);},removeItem:async key=>{database.delete(key);values.delete(key);}};
let reloads=0,tokenClears=0;
const snapshot=compile('frontend/src/modules/backupSnapshot.ts',{
  '@react-native-async-storage/async-storage':asyncStorage,'react-native':{Platform:{OS:'android'}},'./deviceDataStorage':{deviceDataStorage:localStorage},
  './customCategories':{ensureCategoriesLoaded:async()=>{},buildBackup:()=>({categories:board,categoryCount:1,wordCount:1}),reloadCategoriesFromDevice:async()=>{reloads++;},setSeedLanguage:()=>{}},
  './localBoardCodec':{serializeLocalBoard:JSON.stringify,parseLocalBoard:JSON.parse},'./storage':{hydrateStorage:async()=>{},loadSettings:()=>({language:'en-US'})},'./backupCrypto':cryptography,
  'expo-file-system/legacy':{documentDirectory:'file:///new-device/',EncodingType:{Base64:'base64'},makeDirectoryAsync:async()=>{},readAsStringAsync:async uri=>{if(!files.has(uri))throw Error('Missing media');return files.get(uri);},writeAsStringAsync:async(uri,data)=>{files.set(uri,data);}},
});
assert.equal(snapshot.canBackUpKey('angeltalk_backup_recovery_v1'),false);assert.equal(snapshot.canBackUpKey('angeltalk_access_token'),false);assert.equal(snapshot.canBackUpKey('angeltalk_cloud_account'),true);
const data=await snapshot.captureAppSnapshot('Asia/Karachi');await snapshot.includeLocalMedia(data);assert.equal(Object.keys(data.media).length,2);assert.ok(!JSON.stringify(data).includes('AUTH_TOKEN_NOT_IN_BACKUP'));
const vaults=new Map();let uploads=0;
const originalFetch=global.fetch;
global.fetch=async(url,options={})=>{const match=String(url).match(/backups\/([a-f0-9]{64})(.*)$/);assert.ok(match);const [,id]=match;if(options.method==='PUT'){uploads++;const envelope=JSON.parse(options.body);assert.ok(!options.body.includes('PRIVATE_WORD'));assert.ok(!options.body.includes('original-private-password'));vaults.set(id,envelope);return{ok:true,json:async()=>({data:{uploadedAt:new Date().toISOString(),nextBackupAt:time.nextLocalMidnight(new Date(),envelope.timeZone).toISOString()}})};}if(options.method==='POST')return{ok:true,json:async()=>({data:{}})};const found=vaults.get(id);return{ok:!!found,json:async()=>found?{data:found}:{message:'No backup found'}};};
function client(){return compile('frontend/src/modules/automaticBackup.ts',{
  '@react-native-async-storage/async-storage':asyncStorage,'expo-secure-store':{getItemAsync:async key=>secure.get(key)??null,setItemAsync:async(key,value)=>{secure.set(key,value);}},'react-native':{Platform:{OS:'android'},AppState:{addEventListener:()=>{}}},
  './backendSync':{BACKEND_URL:'https://backup.test',clearTokens:async()=>{tokenClears++;values.delete('angeltalk_access_token');}},'./customCategories':{subscribeCategories:()=>{}},'./backupCrypto':cryptography,'./backupSnapshot':snapshot,'./backupTime':time,
});}
const originalDateTimeFormat=Intl.DateTimeFormat;let activeZone="UTC";
try{
Intl.DateTimeFormat=function(locale,options){const formatter=new originalDateTimeFormat(locale,options);if(!options){const originalResolved=formatter.resolvedOptions.bind(formatter);formatter.resolvedOptions=()=>({...originalResolved(),timeZone:activeZone});}return formatter;};
const first=client();const recovery=await first.getRecoveryCode();await first.backupNow();assert.equal(uploads,1);await first.backupNow(false);assert.equal(uploads,1);activeZone="Asia/Riyadh";const travelled=client();await travelled.backupNow(false);assert.equal(uploads,2,"Travel to another time zone must update midnight scheduling after restart");
values.clear();database.clear();secure.clear();files.clear();
const reinstalled=client();assert.notEqual(await reinstalled.getRecoveryCode(),recovery);
const recovered=await reinstalled.findRecoveryBackup(recovery);assert.equal(recovered.categoryCount,1);assert.equal(recovered.wordCount,1);
await reinstalled.restoreRecoveryBackup(recovery,recovered);assert.equal(await reinstalled.getRecoveryCode(),recovery);assert.equal(tokenClears,1);assert.ok(reloads>0);
const restored=JSON.parse(values.get('kiddocare_custom_categories_wordfile_v6'));assert.equal(restored[0].words[0].label,'PRIVATE_WORD');assert.ok(restored[0].words[0].imageUri.endsWith('.webp'));assert.ok(restored[0].words[0].audioUri.endsWith('.mp3'));assert.equal(files.get(restored[0].words[0].imageUri),Buffer.from('private picture').toString('base64'));assert.equal(JSON.parse(values.get('kiddocare_deleted_items_wordfile_v6'))[0],'word::food::bread');assert.equal(JSON.parse(values.get('angeltalk_cloud_account')).email,'original-family@test.com');
const beforeValues=[...values],beforeDatabase=[...database];const broken={...recovered,entries:{kiddocare_new_device_key:{storage:'device',value:'temporary'},...recovered.entries}};failKey='kiddocare_settings';await assert.rejects(()=>snapshot.restoreAppSnapshot(broken));assert.deepEqual([...values].sort(),beforeValues.sort());assert.deepEqual([...database].sort(),beforeDatabase.sort());
console.log('PASS: actual Expo AES-GCM encryption, nonce uniqueness, wrong-code/tamper rejection, midnight/DST, complete app snapshot, custom images/audio, reinstall recovery, original family account, deletion markers, upload deduplication and safe rollback.');
}finally{global.fetch=originalFetch;Intl.DateTimeFormat=originalDateTimeFormat;}
})().catch(error=>{console.error(error);process.exitCode=1;});
