'use strict';
// Store only fingerprinted public game assets. Account/API responses and the
// real-time event stream are NEVER cached.
const CACHE='mu-h5-static-v1';
const STATIC=/\.[a-z0-9]{1,10}$/i; // all fingerprinted public asset types
let written=0;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('mu-h5-static-')&&key!==CACHE)await caches.delete(key);
 // Cached audio is stored as complete bytes and served with correct Range status.
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith('/mu/'))return;
 if(url.pathname.startsWith('/mu/api/')||url.pathname==='/mu/assets-version.json'||url.pathname==='/mu/sw.js'||url.pathname==='/mu/')return;
 // Only public files with an exact fingerprint may be cached.
 if(!/^[a-f0-9]{24}$/.test(url.searchParams.get('v')||'')||!STATIC.test(url.pathname))return;
 if(request.headers.has('X-MU-Prefetch'))return; // bulk downloader owns its cache write
 // Audio is only stored by the explicit full-download action, never lazily.
 // Cached bytes are served with correct HTTP Range responses for Chrome.
 if(/\.(?:mp3|ogg|wav)$/i.test(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   const stored=await cache.match(request.url);
   if(!stored)return fetch(request);
   const range=request.headers.get('range');
   if(!range)return stored;
   const match=/^bytes=(\d*)-(\d*)$/i.exec(range.trim());
   if(!match)return fetch(request);
   const bytes=await stored.blob(),size=bytes.size;
   let start=match[1]===''?null:Number(match[1]);
   let end=match[2]===''?null:Number(match[2]);
   if(start===null){start=Math.max(0,size-(end||0));end=size-1;}
   else if(end===null)end=size-1;
   else end=Math.min(end,size-1);
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)
    return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
   return new Response(bytes.slice(start,end+1),{status:206,headers:{
    'Content-Type':stored.headers.get('Content-Type')||'application/octet-stream',
    'Accept-Ranges':'bytes','Content-Range':'bytes '+start+'-'+end+'/'+size,
    'Content-Length':String(end-start+1)
   }});
  })());
  return;
 }
 if(request.headers.has('range'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const stored=await cache.match(request);
  if(stored)return stored;
  const response=await fetch(request);
  if(response.ok&&response.type==='basic'){
   // Clone synchronously before returning response to the browser;
   // otherwise its stream may already be consumed when cache.put runs.
   const copy=response.clone();
   event.waitUntil((async()=>{
    try{
     await cache.put(request,copy);
     // Full game preloads require thousands of entries. Never evict at 400.
     // Old hashed entries are cleaned after a user-triggered full update.
     written++;
    }catch(e){
     console.warn('MU cache skipped:',e&&e.name||e);
    }
   })());
  }
  return response;
 })());
});
