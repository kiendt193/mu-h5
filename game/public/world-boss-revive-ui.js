'use strict';
// One popup for World Boss deaths. All balances and revival counters are
// authoritative on the server, never calculated from client values.
(function(){
 const id='muWorldBossRevive';
 let busy=false,lastStep='',modalOpen=false;
 const root=document.createElement('div');root.id=id;root.hidden=true;
 root.style.cssText='position:fixed;inset:0;z-index:260000;background:#05090de8;display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box';
 root.innerHTML='<section style="width:min(430px,100%);max-height:90dvh;overflow:auto;background:linear-gradient(135deg,#1b2529,#0a1015);border:2px solid #b39a62;padding:22px;color:#f2e1ba;box-shadow:0 0 30px #000"><h2 style="margin-top:0">⚔ Bạn đã bị Boss thế giới hạ!</h2><p id="muBossReviveDesc"></p><p id="muBossReviveWallet"></p><div style="display:flex;gap:12px;flex-wrap:wrap"><button id="muBossReviveHere" type="button" style="padding:10px 14px">Hồi sinh tại chỗ</button><button id="muBossReviveTown" type="button" style="padding:10px 14px">Về thành (miễn phí)</button></div><p id="muBossReviveError" style="color:#ff9a82"></p></section>';
 document.body.appendChild(root);
 const desc=root.querySelector('#muBossReviveDesc'),wallet=root.querySelector('#muBossReviveWallet'),here=root.querySelector('#muBossReviveHere'),town=root.querySelector('#muBossReviveTown'),error=root.querySelector('#muBossReviveError');
 async function revive(option){
  if(busy)return;busy=true;here.disabled=town.disabled=true;
  error.textContent='';
  try{const r=await api('worldBossRevive',{action:option});apply(r);toast(option==='town'?'Đã hồi sinh tại thành':'Đã hồi sinh tại chỗ');}
  catch(e){error.textContent=e.message||'Không thể hồi sinh';}
  finally{busy=false;draw();}
 }
 here.onclick=()=>revive('here');town.onclick=()=>revive('town');
 function draw(){
  const r=typeof state==='undefined'?null:state?.worldBossRevive;
  if(!r||state?.me?.hp>0){
   if(modalOpen){modalOpen=false;root.hidden=true;root.style.display='none';lastStep='';}
   return;
  }
  if(!modalOpen){modalOpen=true;root.hidden=false;root.style.display='flex';}
  const key=String(r.at)+'-'+r.step;
  if(key!==lastStep){lastStep=key;error.textContent='';}
  desc.textContent=r.forceTown?'Lần gục thứ 6: hệ thống tự đưa bạn về thành sau 3 giây.':'Lần gục '+r.step+'/6. Bạn có thể hồi sinh tại chỗ để tiếp tục đánh boss, hoặc về thành và bắt đầu lại chu kỳ.';
  wallet.textContent='Phúc duyên: '+Number(r.points||0).toLocaleString('vi-VN')+(r.cost!=null?' · Phí tại chỗ: '+r.cost+' điểm':'');
  here.hidden=!!r.forceTown;here.disabled=busy||r.forceTown||Number(r.points||0)<Number(r.cost||0);
  town.hidden=!!r.forceTown;town.disabled=busy;
 }
 const applyBefore=apply;
 apply=function(packet){const x=applyBefore(packet);draw();return x;};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw()});
 setInterval(()=>{if(modalOpen||state?.me?.hp<=0)draw()},450);
})();
