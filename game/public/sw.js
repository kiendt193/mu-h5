'use strict';
// Store only fingerprinted public game assets. Account/API responses and the
// real-time event stream are NEVER cached.
const CACHE='mu-h5-static-v1';
const STATIC=/\.(?:webp|png|jpe?g|svg|gif|js|css|json|woff2?)$/i;
let written=0;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('mu-h5-static-')&&key!==CACHE)await caches.delete(key);
 // Older caches may hold full audio (200) responses which break HTTP Range playback.
 const assetCache=await caches.open(CACHE);
 for(const req of await assetCache.keys()){
  if(/\.(?:mp3|ogg|wav)$/i.test(new URL(req.url).pathname))await assetCache.delete(req);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith('/mu/'))return;
 if(url.pathname.startsWith('/mu/api/')||url.pathname==='/mu/assets-version.json'||url.pathname==='/mu/sw.js'||url.pathname==='/mu/')return;
 // Media files and Range requests must bypass CacheStorage.
 if(request.headers.has('range')||/\.(?:mp3|ogg|wav)$/i.test(url.pathname))return;
 // Fingerprints come from asset-loader's SHA256 manifest, not user input.
 if(!/^[a-f0-9]{24}$/.test(url.searchParams.get('v')||'')||!STATIC.test(url.pathname))return;
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
     if(++written%40===0){
      // Retain boot scripts for future logins, evict older scenery first.
      const keys=await cache.keys();
      let remove=Math.max(0,keys.length-400);
      for(const old of keys){
       if(remove<=0)break;
       if(/\.(?:js|css)(?:\?|$)/i.test(new URL(old.url).pathname))continue;
       if(await cache.delete(old))remove--;
      }
     }
    }catch(e){
     console.warn('MU cache skipped:',e&&e.name||e);
    }
   })());
  }
  return response;
 })());
});
