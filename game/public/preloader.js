'use strict';
/* MU H5 boot preload. Store fingerprinted PUBLIC resources on this device.
 * Never cache /api/, sessions, characters, SSE or unversioned dynamic URLs.
 * Progress counts completed requests, never a simulated timer.
 */
(function(root){
 const STORE='mu-h5-static-v1';
 const MAX_FILES=140, FILE_LIMIT=3*1024*1024, BOOT_LIMIT=/Android|iPhone|iPad/i.test(navigator.userAgent||'')?12*1024*1024:20*1024*1024;
 const TIME_LIMIT=17000, REQUEST_TIMEOUT=6500;
 const sleep=ms=>new Promise(done=>setTimeout(done,ms));
 const normalize=(name,hashes,versionURL)=>{
  const u=new URL(versionURL(name),location.href);
  if(u.origin!==location.origin||!u.pathname.startsWith('/mu/')||u.pathname.startsWith('/mu/api/'))return null;
  const key=decodeURIComponent(u.pathname.slice(4));
  const hash=hashes[key];
  if(!/^[0-9a-f]{24}$/.test(hash||''))return null;
  if(!/\.(?:js|css|json|bin|png|webp|jpe?g|svg|woff2?)$/i.test(key))return null;
  u.searchParams.set('v',hash);
  return u.href;
 };
 function candidates(manifest,versionURL,scriptEls){
  const files=manifest.files||{},unique=new Set(),add=name=>{
   try{const u=normalize(name,files,versionURL);if(u)unique.add(u)}catch{}
  };
  // First, all sequential boot scripts. These are frequently reloaded.
  for(const el of scriptEls)add(el.dataset.src);
  // Then stylesheets, model/map indexes used by the first frame.
  for(const el of document.querySelectorAll('link[rel="stylesheet"]'))add(el.getAttribute('href'));
  for(const key of ['assets/mu05/manifest.json','assets/mu06/maps/manifest.json','assets/mu07/manifest.json','assets/mu05/native-pets.json'])if(files[key])add(key);
  // A SMALL selection of UI images, not the full 13k asset pack.
  let ui=0;
  for(const key of Object.keys(files)){
   if(ui>=28)break;
   if(/^assets\/mu05\/(?:ui|interface|icons|inventory)\//i.test(key)&&/\.(?:webp|png)$/i.test(key)){add(key);ui++}
  }
  return [...unique].slice(0,MAX_FILES);
 }
 function view(title='Tải trước tài nguyên game'){
  const layer=document.createElement('div');
  layer.id='muBootPreload';
  layer.setAttribute('role','status');
  layer.innerHTML='<div class="muBootCard"><div class="muBootRune">✦ MU</div><div class="muBootHeading">'+title+'</div><div class="muBootNote" id="muBootNote">Đang kiểm tra bộ nhớ của thiết bị…</div><div class="muBootTrack"><div id="muBootBar"></div></div><div class="muBootFooter"><span id="muBootPercent">0%</span><button type="button" id="muBootSkip">Bỏ qua để vào game</button></div></div>';
  const style=document.createElement('style');
  style.id='muBootStyle';
  style.textContent='#muBootPreload{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,#34221e 0%,#101b21 65%,#080d12 100%);padding:18px;color:#e9d0a1;font:14px system-ui,sans-serif}#muBootPreload .muBootCard{width:min(440px,100%);border:1px solid #b59759;background:#101c23ed;padding:24px;border-radius:13px;box-shadow:0 10px 60px #0009}#muBootPreload .muBootRune{text-align:center;color:#e6ba63;font:30px Georgia,serif;letter-spacing:6px}#muBootPreload .muBootHeading{text-align:center;margin:15px 0 11px;font-size:18px;font-weight:650}#muBootPreload .muBootNote{font-size:12px;text-align:center;color:#b2bdba;min-height:36px}#muBootPreload .muBootTrack{height:12px;background:#354249;border-radius:12px;overflow:hidden;margin-top:15px}#muBootPreload #muBootBar{height:100%;width:0;background:linear-gradient(90deg,#8f5f39,#efd78e);transition:width .15s}#muBootPreload .muBootFooter{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}#muBootPreload #muBootPercent{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}#muBootPreload #muBootSkip{font-size:12px;padding:8px 12px;color:#f0d6a2;background:#233039;border:1px solid #a48a52;border-radius:7px}';
  document.head.append(style);document.body.append(layer);
  return {layer,note:layer.querySelector('#muBootNote'),bar:layer.querySelector('#muBootBar'),percent:layer.querySelector('#muBootPercent'),skip:layer.querySelector('#muBootSkip')};
 }
 async function prepare(manifest,versionURL,scriptEls,extra=[],title){
  const list=candidates(manifest,versionURL,scriptEls);
  for(const name of extra){try{const url=normalize(name,manifest.files||{},versionURL);if(url&&!list.includes(url))list.push(url);}catch{}}
  if(!list.length)return {total:0,done:0,cached:0};
  if(navigator.connection?.saveData)return {total:list.length,done:0,skipped:true};
  const ui=view(title);
  let closed=false,skipped=false,finished=0,cached=0,network=0,errors=0,totalBytes=0,index=0;
  const started=Date.now();
  const controllers=new Set();
  let wake;const exit=new Promise(resolve=>wake=resolve);
  const finish=()=>{
   if(closed)return;
   closed=true;skipped=true;
   for(const c of controllers)c.abort();
   ui.layer.remove();document.getElementById('muBootStyle')?.remove();
   wake();
  };
  ui.skip.addEventListener('click',finish);
  const watchdog=setTimeout(finish,TIME_LIMIT);
  function update(){
   if(closed)return;
   const percent=Math.round((finished/list.length)*100);
   ui.percent.textContent=percent+'%';
   ui.bar.style.width=percent+'%';
   ui.note.textContent=finished+'/'+list.length+' tệp · '+cached+' đã lưu · '+network+' mới tải'
    +(errors?' · '+errors+' lỗi sẽ tải lại khi cần':'');
  }
  let cache=null;
  try{if('caches' in root)cache=await caches.open(STORE)}catch(e){console.warn('MU preloader: storage unavailable',e);}
  async function one(url){
   const controller=new AbortController();controllers.add(controller);
   const timeout=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT);
   try{
    if(cache&&await cache.match(url)){cached++;return;}
    if(totalBytes>=BOOT_LIMIT||skipped)return;
    const response=await fetch(url,{cache:'force-cache',signal:controller.signal,credentials:'same-origin'});
    if(!response.ok||response.type==='opaque')throw Error('HTTP '+response.status);
    const len=Number(response.headers.get('content-length')||0);
    if(len>FILE_LIMIT||totalBytes+len>BOOT_LIMIT)return;
    // Reading the completed response also warms the browser HTTP cache on first visit.
    const bytes=await response.blob();
    if(skipped)return;
    network++;
    if(bytes.size>FILE_LIMIT||totalBytes+bytes.size>BOOT_LIMIT)return;
    totalBytes+=bytes.size;
    if(cache)try{
     await cache.put(url,new Response(bytes,{status:200,headers:{'Content-Type':response.headers.get('content-type')||'application/octet-stream'}}));
    }catch(e){console.warn('MU preloader cache write:',e?.name||e);}
   }catch(e){if(!skipped)errors++;}
   finally{clearTimeout(timeout);controllers.delete(controller);}
  }
  async function worker(){
   while(!skipped&&index<list.length){
    const url=list[index++];
    await one(url);
    finished++;update();
    if(Date.now()-started>TIME_LIMIT){finish();break;}
   }
  }
  const concurrency=/^(slow-2g|2g)$/.test(navigator.connection?.effectiveType||'')?2:4;
  const jobs=Promise.all(Array.from({length:concurrency},worker));
  jobs.then(finish,finish);
  update();await exit;
  clearTimeout(watchdog);
  return {total:list.length,done:finished,cached,downloaded:network,errors,skipped:finished<list.length};
 }
 // Warm the *selected* map, not every dungeon, before the character enters.
 // The rest of the textures are cached lazily while playing.
 async function prepareMap(state){
  const mc=root.MU_CACHE,person=state?.me,map=person?.map;
  if(!mc?.files||map==null)return;
  const mapInfo=state.maps?.[map]||{};
  const art=mapInfo.terrainArt??map;
  if(!/^[a-z0-9_-]{1,36}$/i.test(String(map))||!/^[a-z0-9_-]{1,36}$/i.test(String(art)))return;
  const clamp=n=>Math.max(0,Math.min(7,Math.floor((Number(n)||0)/1024)));
  const xx=clamp(person.x),yy=clamp(person.y),extras=[
   'assets/mu06/maps/map'+art+'/objects.json',
   'assets/mu07/map'+map+'.json',
   'assets/mu07/height'+map+'.bin',
   'assets/mu07/attrs'+map+'.bin'
  ];
  for(let y=Math.max(0,yy-1);y<=Math.min(7,yy+1);y++)
   for(let x=Math.max(0,xx-1);x<=Math.min(7,xx+1);x++)
    extras.push('assets/mu06/maps/map'+art+'/'+x+'-'+y+'.webp');
  const fileSubset={};
  for(const name of extras)if(mc.files[name])fileSubset[name]=mc.files[name];
  if(Object.keys(fileSubset).length===0)return;
  return prepare({files:fileSubset},mc.url,[],extras,'Tải khu vực trước khi vào game');
 }
 root.MU_PRELOAD={prepare,candidates,prepareMap};
})(window);
