 'use strict';
(async()=>{
 const originalFetch=window.fetch.bind(window);
 let manifest;try{const r=await originalFetch('/mu/assets-version.json',{cache:'no-store'});if(!r.ok)throw Error('Không lấy được phiên bản tài nguyên');manifest=await r.json();}catch(e){document.getElementById('authError').textContent='Không tải được game. Kiểm tra mạng rồi tải lại trang.';return;}
 const versionURL=value=>{try{const u=new URL(value,location.href);if(u.origin!==location.origin||!u.pathname.startsWith('/mu/'))return value;const key=decodeURIComponent(u.pathname.slice(4)),hash=manifest.files[key];if(!hash)return value;u.searchParams.set('v',hash);return u.href;}catch{return value;}};
 window.MU_CACHE={revision:manifest.revision,url:versionURL};
 window.fetch=(input,init)=>originalFetch(typeof input==='string'||input instanceof URL?versionURL(input):input,init);
 for(const [proto,key]of [[HTMLImageElement.prototype,'src'],[HTMLMediaElement.prototype,'src']]){const d=Object.getOwnPropertyDescriptor(proto,key);if(d?.set)Object.defineProperty(proto,key,{...d,set(v){const next=versionURL(v);if(d.get.call(this)!==next)d.set.call(this,next);}});}
 const NativeAudio=window.Audio;window.Audio=function(src){const a=new NativeAudio();if(src!==undefined)a.src=src;return a;};window.Audio.prototype=NativeAudio.prototype;
 const attr=Element.prototype.setAttribute;Element.prototype.setAttribute=function(k,v){return attr.call(this,k,(k==='src'&&(this instanceof HTMLImageElement||this instanceof HTMLMediaElement))?versionURL(v):v);};
 for(const im of document.images){const src=im.getAttribute('src');if(src)im.src=src;}
 try{const bootScripts=[...document.querySelectorAll('script[data-src]')];if(window.MU_PRELOAD)try{await window.MU_PRELOAD.prepare(manifest,versionURL,bootScripts);}catch(e){console.warn('MU preloader skipped:',e);}for(const el of bootScripts){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=versionURL(el.dataset.src);s.onload=resolve;s.onerror=()=>reject(Error(el.dataset.src));document.body.append(s);});}}catch(e){document.getElementById('authError').textContent='Thiếu tệp game. Tải lại trang để thử lại.';console.error(e);}
})();
