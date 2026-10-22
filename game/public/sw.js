'use strict';
// Cache only SHA-fingerprinted public game files, never login, API, SSE or saves.
// A CDN origin must be announced by our first-party page after a revision probe.
const CACHE='mu-h5-static-v1',SETTINGS='mu-h5-cdn-settings-v1';
const MARKER=self.location.origin+'/mu/__asset-cdn-origin';
const STATIC=/\.[a-z0-9]{1,10}$/i;
let cdnOrigin='',cdnReady=null;
async function savedCDN(){
 if(cdnOrigin)return cdnOrigin;
 if(!cdnReady)cdnReady=(async()=>{
  try{
   const response=await (await caches.open(SETTINGS)).match(MARKER);
   if(!response)return '';
   const candidate=new URL(await response.text());
   if(candidate.protocol==='https:'&&!candidate.username&&!candidate.password&&candidate.pathname==='/'&&!candidate.search&&!candidate.hash)cdnOrigin=candidate.origin;
  }catch{}
  return cdnOrigin;
 })();
 return cdnReady;
}
self.addEventListener('message',event=>{
 if(event.data?.type!=='MU_CDN_ORIGIN')return;
 let origin='';
 try{
  const u=new URL(event.data.origin);
  if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)return;
  origin=u.origin;
 }catch{return;}
 cdnOrigin=origin;cdnReady=Promise.resolve(origin);
 event.waitUntil((async()=>{
  try{
   const config=await caches.open(SETTINGS);
   await config.put(MARKER,new Response(origin,{headers:{'Content-Type':'text/plain'}}));
  }catch{}
 })());
});
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('mu-h5-static-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET')return;
 if(!url.pathname.startsWith('/mu/'))return;
 if(url.pathname.startsWith('/mu/api/')||url.pathname==='/mu/assets-version.json'||url.pathname==='/mu/assets-revision.json'||url.pathname==='/mu/cdn-config.json'||url.pathname==='/mu/sw.js'||url.pathname==='/mu/')return;
 if(!/^[a-f0-9]{24}$/.test(url.searchParams.get('v')||'')||!STATIC.test(url.pathname))return;
 const external=url.origin!==self.location.origin;
 if(external&&!url.pathname.startsWith('/mu/assets/'))return;
 if(!external&&request.headers.has('X-MU-Prefetch'))return;
 event.respondWith((async()=>{
  if(external&&url.origin!==await savedCDN())return fetch(request);
  const cache=await caches.open(CACHE),stored=await cache.match(request.url);
  if(/\.(?:mp3|ogg|wav)$/i.test(url.pathname)){
   if(!stored)return fetch(request);
   const range=request.headers.get('range');
   if(!range)return stored;
   const match=/^bytes=(\d*)-(\d*)$/i.exec(range.trim());
   if(!match)return fetch(request);
   const bytes=await stored.blob(),size=bytes.size;
   let start=match[1]===''?null:Number(match[1]),end=match[2]===''?null:Number(match[2]);
   if(start===null){start=Math.max(0,size-(end||0));end=size-1;}
   else if(end===null)end=size-1;else end=Math.min(end,size-1);
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)
    return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
   return new Response(bytes.slice(start,end+1),{status:206,headers:{
    'Content-Type':stored.headers.get('Content-Type')||'application/octet-stream',
    'Accept-Ranges':'bytes','Content-Range':'bytes '+start+'-'+end+'/'+size,
    'Content-Length':String(end-start+1)
   }});
  }
  if(request.headers.has('range'))return fetch(request);
  if(stored)return stored;
  const response=await fetch(request);
  if(response.ok&&(response.type==='basic'||response.type==='cors')){
   const copy=response.clone();
   event.waitUntil(cache.put(request.url,copy).catch(e=>console.warn('MU cache skipped',e?.name||e)));
  }
  return response;
 })());
});
