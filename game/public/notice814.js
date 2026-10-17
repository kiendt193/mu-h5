'use strict';
const MU_NOTICE814=(function(){
 const message='Mọi ý tưởng xin gửi về số zalo 0948297373 để trò chơi ngày càng hoàn thiện, phiên bản miễn phí trọn đời không thu bất kỳ khoản phí nào';
 const interval=30*60*1000;
 function controller({now=Date.now,set=setTimeout,clear=clearTimeout,announce,hide}){
  let authenticated=false,playing=false,next=0,timer=null;
  function cancel(){if(timer!==null)clear(timer);timer=null;}
  function check(){cancel();if(!authenticated||!playing)return;if(now()>=next){announce(message);next=now()+interval;}timer=set(check,Math.max(1,next-now()));}
  return {login(){if(authenticated)return;authenticated=true;next=0;},view(active){playing=active;if(active)check();else{cancel();hide();}},resume:check,logout(){authenticated=false;playing=false;next=0;cancel();hide(true);}};
 }
 if(typeof document!=='undefined'){
  const style=document.createElement('style');style.textContent=`
  #notice814Ticker{position:absolute;left:8px;right:8px;top:108px;z-index:12;overflow:hidden;height:29px;line-height:29px;border:1px solid #ad8e49;background:#101619df;color:#ffdf87;border-radius:4px;pointer-events:none;font-size:12px}
  #notice814Ticker[hidden],#notice814Popup[hidden]{display:none!important}
  #notice814Ticker span{display:inline-block;white-space:nowrap;will-change:transform;animation:notice814Scroll var(--notice814Duration,38s) linear 1 both}
  @keyframes notice814Scroll{from{transform:translateX(var(--notice814Start,100vw))}to{transform:translateX(-100%)}}
  @media(prefers-reduced-motion:reduce){#notice814Ticker{height:auto;max-height:90px;line-height:1.5;padding:5px}#notice814Ticker span{animation:none;white-space:normal}}
  `;document.head.appendChild(style);
  const ticker=document.createElement('div');ticker.id='notice814Ticker';ticker.hidden=true;ticker.setAttribute('role','status');const line=document.createElement('span');ticker.appendChild(line);document.querySelector('.viewport').appendChild(ticker);
  let hideTimer=null;
  /* notice world120: ticker only; no chat or popup */
  const instance=controller({announce(text){
   clearTimeout(hideTimer);line.textContent=text;ticker.hidden=false;const width=ticker.clientWidth;const seconds=Math.max(25,Math.min(70,(width+line.scrollWidth)/45));ticker.style.setProperty('--notice814Start',width+'px');ticker.style.setProperty('--notice814Duration',seconds+'s');line.style.animation='none';void line.offsetWidth;line.style.animation='';hideTimer=setTimeout(()=>{ticker.hidden=true;},seconds*1000+1000);
  },hide(all){clearTimeout(hideTimer);ticker.hidden=true;}});
  const inGame=()=>!!state?.me&&document.getElementById('login').hidden;
  const oldApi=api;api=async function(op,body){try{const r=await oldApi(op,body);if(op==='login'||op==='register'||op==='me')instance.login();if(op==='logout')instance.logout();return r;}catch(e){if(e.status===401)instance.logout();throw e;}};
  const oldRoster=showRoster;showRoster=function(r){const result=oldRoster(r);instance.login();instance.view(false);return result;};
  new MutationObserver(()=>instance.view(inGame())).observe(document.getElementById('login'),{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)instance.resume();});
  if(rosterData||state?.me){instance.login();instance.view(inGame());}
 }
 return {message,interval,controller};
})();
if(typeof module!=='undefined')module.exports=MU_NOTICE814;
