'use strict';
// Cloudflare Pages CDN build, statics ONLY. Never publish accounts, secrets,
// server source, or Neon data. Use Cloudflare's Git integration.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {catalog}=require('./asset-cache.cjs');
const root=path.resolve(__dirname,'public');
const src=path.join(root,'assets');
const out=path.resolve(__dirname,'../cdn-dist');
const dest=path.join(out,'mu','assets');
console.log('[MU-CDN] Node '+process.version+'; build working directory: '+process.cwd());
console.log('[MU-CDN] Input: '+src+'; output: '+out);
const MAX_FILES=20000,MAX_SIZE=25*1024*1024;
if(!fs.existsSync(src)||!fs.statSync(src).isDirectory())throw Error(
 'Missing game/public/assets. Set Pages Root directory to the GIT REPOSITORY ROOT (blank), '+
 'Build command: node game/build-cloudflare-pages.cjs, Output: cdn-dist.'
);
console.log('[MU-CDN] Scanning public files and calculating asset SHA-256 hashes...');
const hashes=catalog(root).files;
const assets=Object.entries(hashes).filter(([key])=>key.startsWith('assets/'))
 .sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
console.log('[MU-CDN] Found '+assets.length+' public game asset files.');
if(!assets.length)throw Error('Empty asset catalog; game/public/assets contains no public files.');

if(assets.length+3>MAX_FILES)throw Error(
 'Cloudflare Pages Free limit is 20,000 files. Found '+assets.length+
 '; move a portion of assets to R2 or reduce the asset count.'
);
let bytes=0,largest={name:'',size:0};
const compressed={};const compressionOutput=new Map();
for(const [name] of assets){
 const file=path.join(root,name);
 if(!file.startsWith(src+path.sep))throw Error('Invalid asset path: '+name);
 const info=fs.lstatSync(file);
 if(!info.isFile()||info.isSymbolicLink())throw Error('Unexpected file type: '+name);
 bytes+=info.size;
 if(info.size>largest.size)largest={name,size:info.size};
 if(info.size>MAX_SIZE){
  if(!/\.json$/i.test(name))throw Error('Cloudflare Pages 25 MiB/file limit for non-JSON resource: '+name+' = '+info.size+' bytes. Place it on R2.');
  // Serve a lossless GZIP variant under a neutral extension so the browser
  // receives raw gzip bytes instead of Cloudflare auto-decoding a .gz suffix.
  const packed=zlib.gzipSync(fs.readFileSync(file),{level:9});
  if(packed.length>MAX_SIZE)throw Error('GZIP could not fit JSON resource into Pages 25 MiB/file limit: '+name+' ('+packed.length+' bytes). Use R2.');
  const variant=name+'.mucdn';
  compressed[name]={path:variant,encoding:'gzip',bytes:packed.length};
  compressionOutput.set(variant,packed);
  console.log('[MU-CDN] Packed oversized JSON '+name+': '+info.size+' -> '+packed.length+' bytes ('+(100*packed.length/info.size).toFixed(1)+'%).');
 }
}
console.log('[MU-CDN] Preflight passed: '+assets.length+' files, '+(bytes/1048576).toFixed(1)+
 ' MiB; largest '+largest.name+' ('+(largest.size/1048576).toFixed(2)+' MiB).');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.cpSync(src,dest,{recursive:true,force:true,dereference:false});
for(const [original,info]of Object.entries(compressed)){
 const full=path.join(out,'mu',original);
 fs.rmSync(full);
 fs.writeFileSync(path.join(out,'mu',info.path),compressionOutput.get(info.path));
}
const assetsRevision=crypto.createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0,24);
fs.writeFileSync(path.join(out,'mu','cdn-check.json'),JSON.stringify({ok:true,assetsRevision,count:assets.length,bytes,compressed}));
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
console.log('[MU-CDN] Build ready: '+out+'; uploading to Cloudflare Pages should start next.');
console.log(JSON.stringify({ok:true,fileCount:assets.length,bytes,largest,assetsRevision,output:out}));
