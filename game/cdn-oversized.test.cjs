'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const zlib=require('node:zlib');
const {spawnSync}=require('node:child_process');
const vm=require('node:vm');
const crypto=require('node:crypto');

test('Pages builds a lossless gzip variant instead of publishing 28 MiB JSON',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mu-pages-gzip-'));
 const game=path.join(root,'game'),publicDir=path.join(game,'public');
 fs.mkdirSync(path.join(publicDir,'assets','mu05'),{recursive:true});
 try{
  fs.copyFileSync(path.join(__dirname,'build-cloudflare-pages.cjs'),path.join(game,'build-cloudflare-pages.cjs'));
  fs.copyFileSync(path.join(__dirname,'asset-cache.cjs'),path.join(game,'asset-cache.cjs'));
  fs.writeFileSync(path.join(publicDir,'game.js'),'console.log("test")');
  const original=JSON.stringify({models:{example:'M'.repeat(27*1024*1024)}});
  const source=path.join(publicDir,'assets','mu05','manifest.json');
  fs.writeFileSync(source,original);
  const child=spawnSync(process.execPath,[path.join(game,'build-cloudflare-pages.cjs')],{
   cwd:root,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  assert.equal(child.status,0,child.stderr||child.stdout);
  const output=path.join(root,'cdn-dist','mu');
  const packed=path.join(output,'assets','mu05','manifest.json.mucdn');
  assert(fs.existsSync(packed));
  assert(!fs.existsSync(path.join(output,'assets','mu05','manifest.json')));
  assert(fs.statSync(packed).size<25*1024*1024);
  assert.equal(zlib.gunzipSync(fs.readFileSync(packed)).toString(),original);
  const meta=JSON.parse(fs.readFileSync(path.join(output,'cdn-check.json'),'utf8'));
  assert.equal(meta.ok,true);
  assert.equal(meta.compressed['assets/mu05/manifest.json'].path,'assets/mu05/manifest.json.mucdn');
  assert.equal(meta.compressed['assets/mu05/manifest.json'].encoding,'gzip');
  assert.match(child.stdout,/Packed oversized JSON/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});

test('Loader obtains decompressed original JSON from CDN and falls back to Render if unavailable',async()=>{
 const manifestJSON=JSON.stringify({models:{Sword27:{meshes:[{count:6}]}}});
 const packed=zlib.gzipSync(manifestJSON);
 const sha=crypto.createHash('sha256').update(manifestJSON).digest('hex').slice(0,24);
 const source=fs.readFileSync(path.join(__dirname,'public','asset-loader.js'),'utf8')
  .replace('(async()=>{','window.__loaded=(async()=>{');
 async function run(withDecompression){
  const requests=[];
  const make=(obj,cors=false)=>{const r=new Response(JSON.stringify(obj),{headers:{'Content-Type':'application/json'}});if(cors)Object.defineProperty(r,'type',{value:'cors'});return r};
  const window={};
  window.fetch=async(input)=>{
   const uri=String(input);requests.push(uri);
   if(uri.includes('/mu/assets-revision.json'))return make({revision:'r'});
   if(uri.includes('/mu/assets-version.json'))return make({revision:'r',files:{'assets/mu05/manifest.json':sha,'game.js':'a'.repeat(24)}});
   if(uri.includes('/mu/cdn-config.json'))return make({origin:'https://cdn.example.test',assetsRevision:'fingerprint'});
   if(uri.includes('/mu/cdn-check.json'))return make({ok:true,assetsRevision:'fingerprint',
    compressed:{'assets/mu05/manifest.json':{path:'assets/mu05/manifest.json.mucdn',encoding:'gzip',bytes:packed.length}}},true);
   if(uri.includes('.json.mucdn'))return new Response(packed);
   if(uri.includes('/mu/assets/mu05/manifest.json'))return make(JSON.parse(manifestJSON));
   throw new Error('unexpected fetch '+uri);
  };
  class Element{setAttribute(){}}
  class HTMLImageElement extends Element{}
  class HTMLMediaElement extends Element{}
  Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,get(){return this._src||''},set(v){this._src=v}});
  Object.defineProperty(HTMLMediaElement.prototype,'src',{configurable:true,get(){return this._src||''},set(v){this._src=v}});
  class Audio extends HTMLMediaElement{}
  window.Audio=Audio;
  const ctx={window,document:{getElementById:()=>({textContent:''}),querySelectorAll:()=>[],images:[],body:{append(){} } },
   location:{href:'https://game.example/mu/',origin:'https://game.example'},
   navigator:{},localStorage:{getItem:()=>null,setItem(){}},URL,Element,
   HTMLImageElement,HTMLMediaElement,Response,DecompressionStream:withDecompression?DecompressionStream:undefined,console};
  vm.runInNewContext(source,ctx);
  await window.__loaded;
  const response=await window.fetch('assets/mu05/manifest.json?v=12.10');
  assert.deepEqual(await response.json(),JSON.parse(manifestJSON));
  assert(requests.some(x=>x.includes('/mu/assets/mu05/manifest.json.mucdn')));
  assert.equal(requests.some(x=>x.startsWith('https://game.example/mu/assets/mu05/manifest.json')),!withDecompression);
 }
 await run(true);await run(false);
});
