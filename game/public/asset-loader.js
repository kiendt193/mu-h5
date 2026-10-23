 'use strict';
(async()=>{
 const originalFetch=window.fetch.bind(window);
 let manifest;try{
 let local=null;try{const saved=localStorage.getItem('mu-assets-manifest-v1');if(saved)local=JSON.parse(saved);}catch{}
 let rev=null;try{const latest=await originalFetch('/mu/assets-revision.json',{cache:'no-store'});if(latest.ok){rev=(await latest.json()).revision;}}catch{}
 if(rev&&local?.revision===rev&&local.files&&Object.keys(local.files).length>100)manifest=local;
 if(!manifest){
  const r=await originalFetch('/mu/assets-version.json',{cache:'no-store'});
  if(!r.ok)throw Error('Không lấy được phiên bản tài nguyên');
  manifest=await r.json();
  try{localStorage.setItem('mu-assets-manifest-v1',JSON.stringify(manifest));}catch{}
 }
}catch(e){document.getElementById('authError').textContent='Không tải được game. Kiểm tra mạng rồi tải lại trang.';return;}
 // CDN is optional. Activate ONLY after the server-configured origin responds
 // with the exact digest of this release's asset files. Never route API/login.
 let cdnOrigin='';const cdnCompressed={};
 try{
  const config=await originalFetch('/mu/cdn-config.json',{cache:'no-store'});
  if(config.ok){
   const info=await config.json();
   const origin=new URL(info.origin);
   if(origin.protocol==='https:'&&origin.origin!==location.origin&&origin.pathname==='/'&&!origin.username&&!origin.password){
    const response=await originalFetch(origin.origin+'/mu/cdn-check.json',{mode:'cors',credentials:'omit',cache:'no-store'});
    if(response.ok&&response.type==='cors'){
     const check=await response.json();
     if(check.ok===true&&check.assetsRevision===info.assetsRevision){
      cdnOrigin=origin.origin;
      for(const [name,variant] of Object.entries(check.compressed||{})){
       if(manifest.files[name]&&name.startsWith('assets/')&&/\.json$/i.test(name)&&
          variant?.encoding==='gzip'&&variant.path===name+'.mucdn'&&
          Number.isSafeInteger(variant.bytes)&&variant.bytes>0&&variant.bytes<25*1024*1024)
        cdnCompressed[name]=variant.path;
      }
     }
    }
   }
  }
 }catch(e){/* Cloudflare not deployed yet, use Render static files */ }
 const sourceURL=value=>{try{const u=new URL(value,location.href);
  if(u.origin!==location.origin||!u.pathname.startsWith('/mu/'))return value;
  const key=decodeURIComponent(u.pathname.slice(4)),hash=manifest.files[key];
  if(!hash)return value;u.searchParams.set('v',hash);return u.href;
 }catch{return value;}};
 const versionURL=value=>{
  const local=sourceURL(value);
  if(!cdnOrigin)return local;
  try{
   const u=new URL(local);
   if(u.origin===location.origin&&u.pathname.startsWith('/mu/assets/')&&/^[a-f0-9]{24}$/.test(u.searchParams.get('v')||'')){
    const name=decodeURIComponent(u.pathname.slice(4));
    const packed=cdnCompressed[name];
    return cdnOrigin+(packed?'/mu/'+packed:u.pathname)+u.search;
   }
  }catch{}
  return local;
 };
 window.MU_CACHE={revision:manifest.revision,url:versionURL,files:manifest.files,cdnOrigin};
 if(cdnOrigin&&navigator.serviceWorker){
  const notify=sw=>sw?.postMessage({type:'MU_CDN_ORIGIN',origin:cdnOrigin});
  notify(navigator.serviceWorker.controller);
  navigator.serviceWorker.ready.then(reg=>notify(reg.active)).catch(()=>{});
 }
 window.fetch=async(input,init)=>{
  if(typeof input!=='string'&&!(input instanceof URL))return originalFetch(input,init);
  const original=String(input),target=versionURL(original);
  if(!cdnOrigin||!target.startsWith(cdnOrigin+'/mu/assets/'))return originalFetch(target,init);
  const options={...init,mode:'cors',credentials:'omit'};
  if(new URL(target).pathname.endsWith('.json.mucdn')){
   // Cloudflare Pages rejects JSON files above 25 MiB. These are stored
   // losslessly as gzip bytes; reconstruct a standard JSON Response.
   // If decompression is unsupported, use the original Render asset.
   try{
    if(typeof DecompressionStream!=='function')throw Error('No gzip decompressor');
    const packed=await originalFetch(target,options);
    if(!packed.ok||!packed.body)throw Error('Compressed asset unavailable');
    const decompressed=await new Response(
     packed.body.pipeThrough(new DecompressionStream('gzip'))
    ).blob();
    return new Response(decompressed,{status:200,headers:{'Content-Type':'application/json'}});
   }catch(e){console.warn('MU compressed CDN fallback',e);return originalFetch(sourceURL(original),init);}
  }
  try{const result=await originalFetch(target,options);if(result.ok)return result;}catch{}
  // Only static asset requests may fall back; accounts and game APIs never leave Render.
  return originalFetch(sourceURL(original),init);
 };
 for(const [proto,key]of [[HTMLImageElement.prototype,'src'],[HTMLMediaElement.prototype,'src']]){
  const d=Object.getOwnPropertyDescriptor(proto,key);
  if(d?.set)Object.defineProperty(proto,key,{...d,set(v){
   const next=versionURL(v);
   if(cdnOrigin&&next.startsWith(cdnOrigin+'/mu/assets/')){
    this.crossOrigin='anonymous'; // Required to draw CDN textures in WebGL/canvas.
    if(this instanceof HTMLImageElement){
     this.__muCDNAssetFallback=sourceURL(v);
     if(!this.__muCDNErrorListener){
      this.__muCDNErrorListener=true;
      this.addEventListener('error',event=>{
       if(!this.src.startsWith(cdnOrigin+'/mu/assets/'))return;
       event.stopImmediatePropagation();
       const local=this.__muCDNAssetFallback;
       this.__muCDNAssetFallback='';
       if(local)d.set.call(this,local);
      },{capture:true});
     }
    }
   }
   if(d.get.call(this)!==next)d.set.call(this,next);
  }});
 }
 const NativeAudio=window.Audio;window.Audio=function(src){const a=new NativeAudio();if(src!==undefined)a.src=src;return a;};window.Audio.prototype=NativeAudio.prototype;
 const attr=Element.prototype.setAttribute;Element.prototype.setAttribute=function(k,v){if(k==='src'&&(this instanceof HTMLImageElement||this instanceof HTMLMediaElement)){this.src=v;return;}return attr.call(this,k,v);};
 for(const im of document.images){const src=im.getAttribute('src');if(src)im.src=src;}
 try{const bootScripts=[...document.querySelectorAll('script[data-src]')];if(window.MU_PRELOAD)try{await window.MU_PRELOAD.prepare(manifest,versionURL,bootScripts);}catch(e){console.warn('MU preloader skipped:',e);}for(const el of bootScripts){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=versionURL(el.dataset.src);s.onload=resolve;s.onerror=()=>reject(Error(el.dataset.src));document.body.append(s);});}}catch(e){document.getElementById('authError').textContent='Thiếu tệp game. Tải lại trang để thử lại.';console.error(e);}
})();
