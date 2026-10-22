'use strict';
// Voluntary, resumable bulk download of public, fingerprinted game resources.
// Session, account, characters and SSE/API data are NEVER stored here.
(function(root){
 const CACHE='mu-h5-static-v1', REGEX=/\.[a-z0-9]{1,10}$/i; // include all public binary, image, sound and model resources
 const LIMIT_IN_FLIGHT=4, LARGE_PACK_ESTIMATE=350*1024*1024;
 const lookup=id=>document.getElementById(id);
 let working=false,cancelled=false,controllers=new Set();
 const validUrl=(path,hash)=>{
  if(!/^[a-f0-9]{24}$/.test(hash))return null;
  if(!REGEX.test(path)||!path||path.includes('..')||path.startsWith('/'))return null;
  if(/^(?:api\/|index\.html$|sw\.js$)/i.test(path))return null;
  const local=new URL(path,location.origin+'/mu/');
  if(local.origin!==location.origin||!local.pathname.startsWith('/mu/'))return null;
  const cdn=root.MU_CACHE?.cdnOrigin;
  const u=cdn&&local.pathname.startsWith('/mu/assets/')?new URL(local.pathname,cdn):local;
  u.searchParams.set('v',hash);return u.href;
 };
 const listFiles=manifest=>Object.entries(manifest?.files||{}).map(([name,hash])=>validUrl(name,hash)).filter(Boolean);
 const output=(line,progress)=>{
  const status=lookup('muFullStatus'),bar=lookup('muFullProgress');
  if(status)status.textContent=line;
  if(bar&&progress!=null)bar.value=progress;
 };
 const fmt=n=>Math.round(n/(1024*1024)*10)/10;
 const skip=()=>{
  cancelled=true;
  for(const c of controllers)c.abort();
 };
 async function run(){
  if(working)return;
  const start=lookup('muFullDownload'),stop=lookup('muFullStop'),clear=lookup('muFullClear');
  const model=root.MU_CACHE;
  if(!model?.files||!model.revision){output('Danh mục tài nguyên chưa sẵn sàng. Tải lại trang và thử lại.');return;}
  if(!('caches' in root)){output('Trình duyệt chưa hỗ trợ lưu bộ tài nguyên bằng CacheStorage.');return;}
  const items=listFiles(model);
  if(!items.length){output('Không tìm thấy tài nguyên có phiên bản hợp lệ.');return;}
  // Request persistent storage only after the user expressly opts in.
  let quota;
  try{
   await navigator.storage?.persist?.();
   quota=await navigator.storage?.estimate?.();
  }catch{}
  const available=quota&&Number.isFinite(quota.quota)&&Number.isFinite(quota.usage)?quota.quota-quota.usage:null;
  if(available!=null&&available<LARGE_PACK_ESTIMATE){
   const ok=confirm('Trình duyệt ước tính chỉ còn '+fmt(available)+' MB cho website. Bạn vẫn muốn tải tiếp? Tệp đã tải sẽ được giữ để tiếp tục lần sau.');
   if(!ok)return;
  }
  working=true;cancelled=false;
  start.disabled=true;if(stop)stop.disabled=false;if(clear)clear.disabled=true;
  let wakeLock=null;try{wakeLock=await navigator.wakeLock?.request?.('screen')}catch{}
  let cache;
  try{cache=await caches.open(CACHE);}
  catch(e){working=false;start.disabled=false;if(stop)stop.disabled=true;if(clear)clear.disabled=false;try{await wakeLock?.release?.()}catch{}output('Không mở được bộ nhớ của trình duyệt: '+(e?.message||e));return;}
  let cursor=0,finished=0,existing=0,downloaded=0,failed=0,storedBytes=0,stoppedQuota=false;
  const mark=()=>{
   const percent=Math.floor(finished/items.length*100);
   output('Đã kiểm tra '+finished.toLocaleString('vi-VN')+'/'+items.length.toLocaleString('vi-VN')
    +' tệp ('+percent+'%) · '+existing.toLocaleString('vi-VN')+' có sẵn · '
    +downloaded.toLocaleString('vi-VN')+' mới lưu · '+fmt(storedBytes)+' MB mới · '+failed+' lỗi',percent);
  };
  async function getOne(url){
   if(cancelled)return;
   const controller=new AbortController();controllers.add(controller);
   const timeout=setTimeout(()=>controller.abort(),25000);
   try{
    if(await cache.match(url)){existing++;return;}
    const external=new URL(url).origin!==location.origin;
    const response=await fetch(url,{signal:controller.signal,credentials:external?'omit':'same-origin',mode:external?'cors':'same-origin',cache:'force-cache',
     ...(external?{}:{headers:{'X-MU-Prefetch':'1'}})});
    if(!response.ok||response.type==='opaque')throw Error('HTTP '+response.status);
    const blob=await response.blob();
    if(cancelled)return;
    await cache.put(url,new Response(blob,{headers:{'Content-Type':response.headers.get('Content-Type')||'application/octet-stream'}}));
    downloaded++;storedBytes+=blob.size;
   }catch(e){
    if(cancelled)return;
    failed++;
    if(e?.name==='QuotaExceededError'){stoppedQuota=true;skip();}
   }finally{clearTimeout(timeout);controllers.delete(controller);}
  }
  async function worker(){
   while(!cancelled&&cursor<items.length){
    const url=items[cursor++];
    await getOne(url);
    finished++;
    if(finished%4===0||finished===items.length)mark();
   }
  }
  mark();
  try{await Promise.all(Array.from({length:LIMIT_IN_FLIGHT},worker));}
  finally{
   working=false;start.disabled=false;if(stop)stop.disabled=true;if(clear)clear.disabled=false;try{await wakeLock?.release?.()}catch{}
   if(stoppedQuota)output('Chrome đã hết hạn mức lưu trữ dành cho website. Đã lưu '+downloaded+' tệp mới; có thể tiếp tục khi có thêm dung lượng.');
   else if(cancelled)output('Đã tạm dừng ở '+finished+'/'+items.length+' tệp. Nhấn “Tiếp tục tải” để tiếp tục từ cache cũ.');
   else if(failed)output('Hoàn tất lượt tải: '+(items.length-failed)+'/'+items.length+' tệp có thể sử dụng. Còn '+failed+' lỗi, nhấn tải lại để thử tiếp.');
   else {
    // Clean outdated hashes only after a complete successful download.
    try{
     const active=new Set(items),older=await cache.keys();let cleared=0;
     for(const req of older){
      if(!active.has(req.url)&&/^[a-f0-9]{24}$/.test(new URL(req.url).searchParams.get('v')||'')){
       if(await cache.delete(req))cleared++;
      }
     }
     output('✓ Đã lưu đủ '+items.length.toLocaleString('vi-VN')+' tài nguyên (bao gồm âm thanh). Lần sau dùng cache, '+cleared+' file cũ đã dọn.',100);
    }catch(e){output('✓ Tải xong '+items.length.toLocaleString('vi-VN')+' tệp, nhưng chưa dọn được cache cũ.');}
   }
   start.textContent='Tiếp tục tải / Kiểm tra cập nhật';
  }
 }
 function initialize(){
  const start=lookup('muFullDownload'),stop=lookup('muFullStop'),clear=lookup('muFullClear');
  if(!start)return;
  start.addEventListener('click',()=>{void run();});
  if(stop){stop.disabled=true;stop.addEventListener('click',skip);}
  if(clear)clear.addEventListener('click',async()=>{
   if(working)return;
   if(!confirm('Xóa toàn bộ tài nguyên MU đã lưu trong cache trình duyệt? Tài khoản và nhân vật trên Neon không bị ảnh hưởng.'))return;
   try{await caches.delete(CACHE);output('Đã xóa tài nguyên tải trước. Game sẽ cần tải lại khi vào lần sau.',0);}
   catch(e){output('Không thể xóa cache: '+(e?.message||e));}
  });
  if(navigator.storage?.estimate){navigator.storage.estimate().then(s=>{
   if(!working&&s&&Number.isFinite(s.usage))output('Website đang sử dụng khoảng '+fmt(s.usage)+' MB lưu trữ của Chrome. Bấm tải trọn bộ để lưu toàn bộ hình ảnh và bản đồ.');
  }).catch(()=>{});}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
 root.MU_FULL_ASSET_DOWNLOAD={listFiles,start:run,pause:skip};
})(window);
