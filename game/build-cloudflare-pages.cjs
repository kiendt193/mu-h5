'use strict';
// Cloudflare Pages CDN build, statics ONLY. Never publish accounts, secrets,
// server source, or Neon data. Use Cloudflare's Git integration.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {catalog}=require('./asset-cache.cjs');
const root=path.resolve(__dirname,'public');
const src=path.join(root,'assets');
const out=path.resolve(__dirname,'../cdn-dist');
const dest=path.join(out,'mu','assets');
const MAX_FILES=20000,MAX_SIZE=25*1024*1024;
if(!fs.existsSync(src)||!fs.statSync(src).isDirectory())throw Error('Missing game/public/assets. Cannot build CDN.');
const hashes=catalog(root).files;
const assets=Object.entries(hashes).filter(([key])=>key.startsWith('assets/'))
 .sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
if(!assets.length)throw Error('Empty asset catalog; refusing to deploy empty CDN.');
if(assets.length+3>MAX_FILES)throw Error('Cloudflare Pages Free 20,000 file limit exceeded: '+assets.length);
let bytes=0,largest={name:'',size:0};
for(const [name] of assets){
 const file=path.join(root,name);
 if(!file.startsWith(src+path.sep))throw Error('Invalid asset path: '+name);
 const info=fs.lstatSync(file);
 if(!info.isFile()||info.isSymbolicLink())throw Error('Unexpected file type: '+name);
 bytes+=info.size;
 if(info.size>largest.size)largest={name,size:info.size};
 if(info.size>MAX_SIZE)throw Error('Cloudflare Pages 25 MiB/file limit: '+name+' = '+info.size+' bytes. Move oversized file to R2 first.');
}
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.cpSync(src,dest,{recursive:true,force:true,dereference:false});
const assetsRevision=crypto.createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0,24);
fs.writeFileSync(path.join(out,'mu','cdn-check.json'),JSON.stringify({ok:true,assetsRevision,count:assets.length,bytes}));
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="vi"><meta charset="utf-8"><title>MU H5 CDN</title><body><h1>MU H5 static game resources</h1><p>Tài nguyên tĩnh; trò chơi và đăng nhập vẫn ở máy chủ riêng.</p></body></html>');
fs.writeFileSync(path.join(out,'_headers'),[
 '/mu/assets/*',
 '  Access-Control-Allow-Origin: *',
 '  Cross-Origin-Resource-Policy: cross-origin',
 '  Cache-Control: public, max-age=31536000, immutable',
 '/mu/cdn-check.json',
 '  Access-Control-Allow-Origin: *',
 '  Cache-Control: no-store',
 ''
].join('\n'));
console.log(JSON.stringify({ok:true,fileCount:assets.length,bytes,largest,assetsRevision,output:out}));
