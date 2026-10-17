 'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
function catalog(root){const files={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile()){const key=path.relative(root,f).split(path.sep).join('/');if(key==='index.html')continue;const b=fs.readFileSync(f);files[key]=crypto.createHash('sha256').update(b).digest('hex').slice(0,24);}}}walk(root);const revision=crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,24);return {revision,files};}
function createAssets(root){const prebuilt=path.join(path.dirname(root),'asset-manifest.prebuilt.json');let manifest;if(process.env.NODE_ENV==='production'&&fs.existsSync(prebuilt)){try{const loaded=JSON.parse(fs.readFileSync(prebuilt,'utf8'));if(!loaded||typeof loaded.revision!=='string'||!loaded.files||typeof loaded.files!=='object'||!loaded.files['game.js'])throw new Error('Malformed prebuilt asset manifest');manifest=loaded;}catch(err){console.error('Asset manifest fallback:',err.message);}}manifest||=catalog(root);const manifestJSON=JSON.stringify(manifest),compressed=zlib.gzipSync(manifestJSON),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.png':'image/png','.svg':'image/svg+xml'};return function(req,res,url){
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 if(url.pathname==='/mu/assets-version.json'){const gzip=/\bgzip\b/.test(req.headers['accept-encoding']||'');res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Accept-Encoding',...(gzip?{'Content-Encoding':'gzip'}:{})});res.end(req.method==='HEAD'?'':gzip?compressed:manifestJSON);return;}
 const relative=url.pathname==='/mu/'?'index.html':url.pathname.startsWith('/mu/')?decodeURIComponent(url.pathname.slice(4)):null;
 if(relative===null){res.writeHead(302,{Location:'/mu/'});res.end();return;}
 const f=path.resolve(root,relative);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404,{'Cache-Control':'no-store'});res.end();return;}
 const hash=manifest.files[relative],versioned=hash&&url.searchParams.get('v')===hash;
 if(relative.startsWith('assets/')&&!versioned){url.searchParams.set('v',hash);res.writeHead(302,{'Location':url.pathname+url.search,'Cache-Control':'no-cache'});res.end();return;}
 const headers={'Content-Type':mime[path.extname(f)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':versioned?'public, max-age=31536000, immutable':'no-cache'};
 if(hash){headers.ETag='"'+hash+'"';if(req.headers['if-none-match']===headers.ETag){res.writeHead(304,headers);res.end();return;}}
 let html;if(relative==='index.html'){html=fs.readFileSync(f,'utf8').replace(/href="([^"?]+\.css)(?:\?[^"]*)?"/g,(all,file)=>manifest.files[file]?'href="'+file+'?v='+manifest.files[file]+'"':all);}
 res.writeHead(200,headers);if(req.method==='HEAD')res.end();else if(html!==undefined)res.end(html);else fs.createReadStream(f).pipe(res);
 };}
module.exports={catalog,createAssets};
