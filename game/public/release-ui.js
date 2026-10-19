'use strict';
// Player-visible build number and fast-maintenance notices, shared by PC/mobile.
(()=>{
 const words={
  vi:{maintenance:'Máy chủ đang cập nhật nhanh, dự kiến khoảng 5 phút. Nhân vật đã lưu, vui lòng chờ và đăng nhập lại.',updated:'Đã có phiên bản MU mới. Tải lại game để cập nhật.',restored:'Máy chủ đã hoạt động. Bạn có thể tiếp tục chơi.'},
  en:{maintenance:'Quick server maintenance (~5 minutes). Your character is saved. Please wait and log in again.',updated:'A new MU version is available. Reload the game to update.',restored:'Server is online. You can continue playing.'},
  zh:{maintenance:'服务器正在快速维护（约5分钟），角色数据已保存，请稍后重新登录。',updated:'MU新版本已上线，请刷新游戏。',restored:'服务器已恢复，可以继续游戏。'},
  id:{maintenance:'Pemeliharaan server singkat (~5 menit). Karakter tersimpan; tunggu lalu login kembali.',updated:'Versi MU baru tersedia. Muat ulang game.',restored:'Server kembali online. Silakan lanjut bermain.'},
  th:{maintenance:'เซิร์ฟเวอร์ปิดปรับปรุงชั่วคราวประมาณ 5 นาที ข้อมูลตัวละครบันทึกแล้ว โปรดรอและเข้าสู่ระบบอีกครั้ง',updated:'มี MU เวอร์ชันใหม่ โปรดโหลดเกมใหม่',restored:'เซิร์ฟเวอร์กลับมาออนไลน์แล้ว เล่นต่อได้เลย'}
 };
 const language=()=>{let l='vi';try{l=localStorage.getItem('mu-language')||'vi'}catch{}return words[l]?l:'vi';};
 const msg=k=>words[language()][k];
 let current=null,seen=false,notice=null,timer=null,switchUntil=0;
 const label=document.getElementById('loginVersion');
 function show(text,kind='maintenance'){
  if(!notice){notice=document.createElement('div');notice.id='muDeploymentNotice';notice.setAttribute('role','status');notice.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);left:50%;transform:translateX(-50%);max-width:min(96vw,720px);width:max-content;z-index:11050;padding:12px 18px;background:#12202af3;color:#ffdf9c;border:1px solid #b39451;border-radius:8px;box-shadow:0 8px 28px #000a;font-size:14px;line-height:1.5;text-align:center;pointer-events:auto';document.body.appendChild(notice);}
  // Show version-update prompts at the center of the visible viewport on PC and mobile.
  // Maintenance/disconnect notices retain their existing position at the top.
  notice.style.top=kind==='updated'?'50%':'calc(env(safe-area-inset-top,0px) + 10px)';
  notice.style.transform=kind==='updated'?'translate(-50%, -50%)':'translateX(-50%)';
  notice.dataset.kind=kind;notice.textContent=text;notice.hidden=false;
 }
 // A closed SSE stream is not proof of maintenance: it also happens when
 // selecting another character, changing tabs or while the browser reconnects.
 const playing=()=>document.getElementById('login')?.hidden===true;
 function clearMaintenance(){if(notice?.dataset.kind==='maintenance')notice.hidden=true;}
 function switching(){switchUntil=Date.now()+15000;clearMaintenance();}
 function switchFailed(){switchUntil=0;}
 function online(){switchUntil=0;clearMaintenance();}
 function disconnect(){if(!playing())clearMaintenance();/* normal SSE reconnect uses the game's connection label */ }
 // Only an explicit server "update" event may display the maintenance notice.
 function shutdown(){if(playing()&&Date.now()>=switchUntil)show(msg('maintenance'));}

 async function poll(){
  try{
   const r=await fetch('/mu/update-info.json?ts='+Date.now(),{cache:'no-store'});
   if(!r.ok)return;
   const v=await r.json();
   if(!v||!v.build)return;
   if(label)label.textContent='FANTASY ONLINE · PHIÊN BẢN '+(v.version||'2.8')+' · '+v.build;
   if(seen&&current&&current!==v.build)show(msg('updated'),'updated');
   current=v.build;seen=true;
  }catch{}
 }
 void poll();
 timer=setInterval(()=>{if(!document.hidden)void poll();},60000);
 // Clear stale maintenance banners when the roster/login becomes visible.
 const login=document.getElementById('login');
 if(login)new MutationObserver(()=>{if(!login.hidden)clearMaintenance();})
  .observe(login,{attributes:true,attributeFilter:['hidden']});
 window.MU_UPDATE_NOTICE={online,disconnect,shutdown,switching,switchFailed,poll};
})();
