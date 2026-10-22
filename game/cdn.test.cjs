'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {createAssets,catalog}=require('./asset-cache.cjs');

test('CDN fingerprint is derived solely from public asset files',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mu-cdn-'));
 const pub=path.join(tmp,'public');
 try{
  fs.mkdirSync(path.join(pub,'assets'),{recursive:true});
  fs.writeFileSync(path.join(pub,'assets','test.bin'),Buffer.from('graphic bytes'));
  fs.writeFileSync(path.join(pub,'game.js'),'console.log("not on CDN")');
  const manifest=catalog(pub),pairs=Object.entries(manifest.files).filter(([n])=>n.startsWith('assets/')).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  const expected=crypto.createHash('sha256').update(JSON.stringify(pairs)).digest('hex').slice(0,24);
  const serve=createAssets(pub),saved=process.env.MU_CDN_ORIGIN;
  process.env.MU_CDN_ORIGIN='https://example.pages.dev';
  let status,headers,body;
  serve({method:'GET'}, {writeHead:(s,h)=>{status=s;headers=h},end:v=>{body=v}},new URL('https://game.example/mu/cdn-config.json'));
  const cfg=JSON.parse(body);
  assert.equal(status,200);
  assert.equal(cfg.origin,'https://example.pages.dev');
  assert.equal(cfg.assetsRevision,expected);
  assert.equal(headers['Cache-Control'],'no-store');
  process.env.MU_CDN_ORIGIN='http://insecure.example';
  serve({method:'GET'}, {writeHead:()=>{},end:v=>{body=v}},new URL('https://game.example/mu/cdn-config.json'));
  assert.equal(JSON.parse(body).origin,'');
  if(saved==null)delete process.env.MU_CDN_ORIGIN;else process.env.MU_CDN_ORIGIN=saved;
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
test('static CDN never includes account data and build has safe public-only paths',()=>{
 const builder=fs.readFileSync(path.join(__dirname,'build-cloudflare-pages.cjs'),'utf8');
 assert.match(builder,/path\.join\(root,'assets'\)/);
 assert.match(builder,/MAX_FILES=20000,MAX_SIZE=25\*1024\*1024/);
 assert.match(builder,/cdn-check\.json/);
 assert.match(builder,/Access-Control-Allow-Origin: \*/);
 const loader=fs.readFileSync(path.join(__dirname,'public','asset-loader.js'),'utf8');
 assert.match(loader,/check\.assetsRevision===info\.assetsRevision/);
 assert.match(loader,/target\.startsWith\(cdnOrigin\+'\/mu\/assets\/'\)/);
 assert.match(loader,/return originalFetch\(sourceURL\(original\),init\)/);
});
test('Service Worker never caches API or unverified CDN and supports versioned audio ranges',()=>{
 const code=fs.readFileSync(path.join(__dirname,'public','sw.js'),'utf8');
 assert.match(code,/\/mu\/api\//);
 assert.match(code,/url\.origin!==await savedCDN\(\)/);
 assert.match(code,/Content-Range/);
 assert.match(code,/response\.type==='basic'\|\|response\.type==='cors'/);
 new vm.Script(code,{filename:'sw.js'});
});
