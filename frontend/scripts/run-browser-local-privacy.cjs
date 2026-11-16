const fs=require('fs');
(async()=>{
const profile='frontend/assets/image-audit/edge-local-privacy-profile';
let port;
for(let attempt=0;attempt<100;attempt++){
try{port=fs.readFileSync(profile+'/DevToolsActivePort','utf8').split('\n')[0];const response=await fetch('http://127.0.0.1:'+port+'/json/list');if(response.ok)break;}catch{}
await new Promise(resolve=>setTimeout(resolve,100));
}
const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let sequence=0;const pending=new Map();let onLoad;
ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);if(message.error)reject(Error(message.error.message));else resolve(message.result);}if(message.method==='Page.loadEventFired'&&onLoad)onLoad();};
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
try{
await call('Page.enable');
const loaded=new Promise(resolve=>{onLoad=resolve;});
await call('Page.navigate',{url:'file:///D:/Angel%20Talk/frontend/assets/image-audit/local-privacy-test.html'});
await loaded;
const result=await call('Runtime.evaluate',{expression:`new Promise(resolve=>{const start=Date.now();const timer=setInterval(()=>{const text=document.getElementById('result')?.textContent;if(text&&text!=='RUNNING'){clearInterval(timer);resolve(text);}else if(Date.now()-start>30000){clearInterval(timer);resolve('FAIL: IndexedDB test timed out');}},50);})`,awaitPromise:true,returnByValue:true});
const text=result.result.value;console.log(text);if(!text?.startsWith('PASS:'))process.exitCode=1;
}finally{await call('Browser.close').catch(()=>{});ws.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
