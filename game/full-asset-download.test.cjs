'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

function setup(){
 const nodes={};
 for(const id of ['muFullDownload','muFullStop','muFullStatus','muFullProgress']){
  nodes[id]={textContent:'',value:0,disabled:false,handlers:{},
   addEventListener(name,fn){this.handlers[name]=fn}};
 }
 const cacheEntries=new Map();
 const cache={
  match:async url=>cacheEntries.get(url),
  put:async(url,response)=>{cacheEntries.set(url,response)},
  keys:async()=>[...cacheEntries.keys()].map(url=>({url})),
  delete:async req=>cacheEntries.delete(req.url)
 };
 const caches={open:async()=>cache};let network=0;
 const files={'assets/map.webp':'a'.repeat(24),'assets/terrain.bin':'b'.repeat(24),
  'assets/sound.ogg':'c'.repeat(24),'assets/weapon.model':'d'.repeat(24),
  'api/secret.json':'e'.repeat(24),'index.html':'f'.repeat(24)};
 const window={MU_CACHE:{revision:'r1',files},caches};
 const globals={window,document:{getElementById:id=>nodes[id],readyState:'complete'},
  navigator:{storage:{persist:async()=>true,estimate:async()=>({quota:12*1024**3,usage:0})}},
  location:{origin:'https://example.test'},URL,Blob,Response,AbortController,
  setTimeout,clearTimeout,caches,confirm:()=>true,console,
  fetch:async()=>{
   network++;
   return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'application/octet-stream'}});
  }};
 const src=fs.readFileSync(path.join(__dirname,'public','full-asset-download.js'),'utf8');
 vm.runInNewContext(src,globals,{filename:'full-asset-download.js'});
 return {window,nodes,cacheEntries,networkRequests:()=>network};
}
test('Full pack includes versioned world models and audio, excludes auth and HTML',()=>{
 const h=setup(),list=h.window.MU_FULL_ASSET_DOWNLOAD.listFiles(h.window.MU_CACHE);
 assert.equal(list.length,4);
 assert(list.some(u=>u.endsWith('.ogg?v='+ 'c'.repeat(24))));
 assert(list.some(u=>u.endsWith('.model?v='+ 'd'.repeat(24))));
 assert(list.every(u=>u.startsWith('https://example.test/mu/')&&!u.includes('/api/')));
});
test('Full download caches all static files, resumes without network and reaches 100%',async()=>{
 const h=setup();
 await h.window.MU_FULL_ASSET_DOWNLOAD.start();
 assert.equal(h.cacheEntries.size,4);
 assert.equal(h.networkRequests(),4);
 assert.equal(h.nodes.muFullProgress.value,100);
 await h.window.MU_FULL_ASSET_DOWNLOAD.start();
 assert.equal(h.networkRequests(),4);
 assert.match(h.nodes.muFullStatus.textContent,/Đã lưu đủ 4 tài nguyên/);
});
test('Service Worker serves cached audio byte ranges with HTTP 206',async()=>{
 const listeners={};
 const u='https://example.test/mu/assets/sound.ogg?v='+'a'.repeat(24);
 const full=new Response(new Uint8Array(1000),{headers:{'Content-Type':'audio/ogg'}});
 let network=0;
 const globals={
  self:{location:{origin:'https://example.test'},addEventListener:(n,cb)=>listeners[n]=cb,
   clients:{claim:async()=>{}},skipWaiting:async()=>{}},
  caches:{open:async()=>({match:async()=>full}),keys:async()=>[]},
  URL,Response,Promise,
  fetch:async()=>{network++;return full}
 };
 const src=fs.readFileSync(path.join(__dirname,'public','sw.js'),'utf8');
 vm.runInNewContext(src,globals,{filename:'sw.js'});
 let res;
 const request={method:'GET',url:u,headers:new Headers({Range:'bytes=200-299'})};
 listeners.fetch({request,respondWith:p=>res=p,waitUntil(){}});
 const part=await res;
 assert.equal(part.status,206);
 assert.equal(part.headers.get('Content-Range'),'bytes 200-299/1000');
 assert.equal((await part.arrayBuffer()).byteLength,100);
 assert.equal(network,0);
});
