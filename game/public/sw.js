'use strict';
// Store only fingerprinted public game assets. Account/API responses and the
// real-time event stream are NEVER cached.
const CACHE='mu-h5-static-v1';
const STATIC=/\.(?:webp|png|jpe?g|svg|gif|js|css|json|mp3|ogg|wav|woff2?)$/i;
let written=0;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('mu-h5-static-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith('/mu/'))return;
 if(url.pathname.startsWith('/mu/api/')||url.pathname==='/mu/assets-version.json'||url.pathname==='/mu/sw.js'||url.pathname==='/mu/')return;
 // Fingerprints come from asset-loader's SHA256 manifest, not user input.
 if(!/^[a-f0-9]{24}$/.test(url.searchParams.get('v')||'')||!STATIC.test(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const stored=await cache.match(request);
  if(stored)return stored;
  const response=await fetch(request);
  if(response.ok&&response.type==='basic'){
   event.waitUntil((async()=>{
    try{
     await cache.put(request,response.clone());
     if(++written%80===0){
      // Bound disk use on mobile. Entries are re-cached as areas are visited.
      const keys=await cache.keys();
      for(const old of keys.slice(0,Math.max(0,keys.length-400)))await cache.delete(old);
     }
    }catch(e){
     // Browsers may evict CacheStorage when the phone is low on space.
     console.warn('MU cache skipped:',e&&e.name||e);
    }
   })());
  }
  return response;
 })());
});
