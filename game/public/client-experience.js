'use strict';
(()=>{
 // Keep account, character, API calls and real-time game stream on the server.
 // Versioned public assets can remain in the browser for repeat visits.
 if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'})
   .catch(err=>console.warn('MU resource cache unavailable:',err.message));
 }
 const button=document.getElementById('keepAwake');
 const overlay=document.getElementById('login');
 if(!button||!overlay)return;
 const supported=!!navigator.wakeLock?.request;
 let wanted=supported,lock=null,busy=false,failed=false;
 const playing=()=>overlay.hidden&&document.visibilityState==='visible';
 function label(){
  button.disabled=!supported;
  button.setAttribute('aria-pressed',String(wanted));
  button.textContent=!supported?'☀ Giữ sáng: Không hỗ trợ':!wanted?'☀ Giữ sáng: Tắt':lock?'☀ Giữ sáng: Bật':failed?'☀ Giữ sáng: Thử lại':'☀ Giữ sáng: Chờ';
  button.title=supported?'Giữ màn hình sáng khi đang chơi. Tự tắt khi ẩn game; có thể bị giới hạn bởi cài đặt tiết kiệm pin.':'Trình duyệt không hỗ trợ Screen Wake Lock';
 }
 async function release(){
  const current=lock;lock=null;
  if(current)try{await current.release()}catch{}
  label();
 }
 async function sync(){
  if(!supported||!wanted||!playing()){await release();return;}
  if(lock||busy)return;
  busy=true;failed=false;
  try{
   const held=await navigator.wakeLock.request('screen');
   if(!wanted||!playing()){await held.release();return;}
   lock=held;
   held.addEventListener('release',()=>{if(lock===held)lock=null;label()});
  }catch(error){failed=true;console.warn('MU screen wake lock unavailable:',error?.name||error);}
  finally{busy=false;label()}
 }
 button.addEventListener('click',()=>{
  wanted=!wanted;
  failed=false;
  label();
  void sync();
 });
 new MutationObserver(()=>{void sync()}).observe(overlay,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{void sync()});
 window.addEventListener('pageshow',()=>{void sync()});
 window.addEventListener('pagehide',()=>{void release()});
 label();
})();
