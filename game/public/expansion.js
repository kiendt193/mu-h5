'use strict';
/* Audio recovery: all nine original map themes and original skill WAVs.
 * New players hear audio after the browser's first interaction; explicit
 * muSound=0 stays muted.  Playback unlocks on EVERY real user interaction
 * instead of a one-shot listener that can fire before the map music exists. */
const MU_AUDIO={
 enabled:(()=>{try{return localStorage.getItem('muSound')!=='0'}catch{return true}})(),
 mapId:null,music:null,last:Object.create(null),sounds:Object.create(null),blocked:false,
 pending:null,lastError:null,
 notice(){
  const button=document.getElementById('sound');
  if(button){button.textContent='♫ Âm thanh: '+(this.enabled?'Bật':'Tắt');button.title=this.blocked&&this.enabled?'Chạm bật nhạc: trình duyệt đang chặn phát tự động':'Bật / tắt nhạc bản đồ và âm thanh kỹ năng';}
  const prompt=document.getElementById('muAudioUnlock');
  if(prompt)prompt.hidden=!(this.enabled&&this.blocked);
 },
 prompt(){
  if(document.getElementById('muAudioUnlock'))return;
  const host=document.querySelector('.mapbadge')||document.querySelector('.viewport');
  if(!host)return;
  const button=document.createElement('button');button.id='muAudioUnlock';button.type='button';
  button.textContent='🔊 Chạm để bật nhạc';
  button.style.cssText='position:absolute;top:calc(100% + 5px);right:0;z-index:80;max-width:210px;border:1px solid #b7985b;border-radius:5px;background:#101a21;color:#ffe0a0;padding:7px 10px;font-size:12px;cursor:pointer';
  button.onclick=()=>{this.enabled=true;this.resume(true)};
  host.appendChild(button);this.notice();
 },
 report(err){
  const reason=err?.name||'AudioError';
  if(reason==='NotAllowedError'||reason==='SecurityError'){
   this.blocked=true;this.prompt();this.notice();
  }else if(reason!=='AbortError'){
   this.lastError=reason;
   console.warn('MU audio playback:',reason,err?.message||'');
  }
 },
 map(id){
  const config=typeof state!=='undefined'?state?.maps?.[id]:null;
  let musicId=Number(config?.musicMap??id);
  if(!Number.isInteger(musicId)||musicId<0||musicId>8)musicId=0;
  if(this.mapId===musicId&&this.music){
   if(this.enabled&&this.music.paused)this.resume(false);
   return;
  }
  const old=this.music;this.music=null;
  if(old){old.pause();old.removeAttribute('src');old.load();}
  this.mapId=musicId;
  const music=new Audio('assets/mu03/audio/map'+musicId+'.mp3');
  music.loop=true;music.preload='auto';music.volume=.24;
  music.addEventListener('error',()=>{this.lastError='Không tải được nhạc map '+musicId;console.warn('MU audio: missing map music',musicId,music.error?.code||'')});
  this.music=music;
  if(this.enabled)this.resume(false);
 },
 resume(gesture){
  if(!this.enabled||document.hidden||!this.music)return;
  if(document.getElementById('login')?.hidden===false)return;
  if(!this.music.paused){this.blocked=false;this.notice();return}
  if(this.pending)return;
  try{
   const task=this.music.play();
   if(task&&typeof task.then==='function'){
    this.pending=task;
    task.then(()=>{this.blocked=false;this.notice()},e=>this.report(e))
      .finally(()=>{if(this.pending===task)this.pending=null});
   }else{this.blocked=false;this.notice()}
  }catch(e){this.report(e)}
 },
 play(kind,variant){
  if(!this.enabled||document.hidden)return;
  const key=kind==='attack'&&['knight','wizard','elf'].includes(variant)?'attack-'+variant:
   kind==='skill'&&['slash','spin','quake','fire','ice','spirit','arrow','multi','icearrow'].includes(variant)?'skill-'+variant:kind;
  const now=Date.now();if(now-(this.last[key]||0)<110)return;
  this.last[key]=now;
  try{
   const voices=this.sounds[key]||(this.sounds[key]=[]);
   let audio=voices.find(a=>a.paused||a.ended);
   if(!audio&&voices.length<3){audio=new Audio('assets/mu03/audio/'+key+'.wav');audio.preload='auto';audio.volume=.35;voices.push(audio)}
   if(!audio)audio=voices[0];
   if(!audio)return;
   if(!audio.paused)audio.pause();
   try{audio.currentTime=0}catch{}
   const task=audio.play();
   task?.catch(e=>this.report(e));
  }catch(e){this.report(e)}
 },
 toggle(){
  this.enabled=!this.enabled;
  try{localStorage.setItem('muSound',this.enabled?'1':'0')}catch{}
  if(this.enabled){this.blocked=false;this.resume(true)}
  else{this.blocked=false;this.music?.pause();for(const voices of Object.values(this.sounds))for(const a of voices)a.pause()}
  this.notice();
 }
};
document.getElementById('sound').onclick=()=>MU_AUDIO.toggle();
MU_AUDIO.notice();
// Browser user activation may happen before or after the game has loaded.
for(const type of ['pointerdown','touchend','keydown']){
 document.addEventListener(type,()=>{if(MU_AUDIO.enabled)MU_AUDIO.resume(true)},{capture:true,passive:true});
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)MU_AUDIO.music?.pause();else MU_AUDIO.resume(false);
});
window.addEventListener('pageshow',()=>MU_AUDIO.resume(false));
const muLoginAudio=document.getElementById('login');
if(muLoginAudio)new MutationObserver(()=>{
 if(!muLoginAudio.hidden)MU_AUDIO.music?.pause();
 else MU_AUDIO.resume(false);
}).observe(muLoginAudio,{attributes:true,attributeFilter:['hidden']});
const extraArt={manifest:null,images:{},pending:new Set()};fetch('assets/mu03/appearance.json').then(r=>r.json()).then(m=>extraArt.manifest=m).catch(()=>{});
function extraImage(file){if(!file)return null;if(extraArt.images[file]){const im=extraArt.images[file];delete extraArt.images[file];extraArt.images[file]=im;return im;}if(!extraArt.pending.has(file)){extraArt.pending.add(file);const im=new Image();im.onload=()=>{extraArt.images[file]=im;const names=Object.keys(extraArt.images);if(names.length>64){const old=names[0];delete extraArt.images[old];extraArt.pending.delete(old)}};im.onerror=()=>extraArt.pending.delete(file);im.src='assets/mu03/'+file;}return null}
function drawBase(p,time,x,y){if(artSprite(p.classId,p.action||'idle',p.facing,time,x,y,112))return;const im=MU_ART.images['portrait-'+p.classId];if(im)ctx.drawImage(im,x-56,y-105,112,112);}
function drawEquipment(p,time,x,y){if(drawLivePlayer(p,x,y))return;const m=extraArt.manifest,gear=p.gear||{},parts=['boot','pant','armor','glove','helm','weapon','shield','wing'];if(!m){drawBase(p,time,x,y);return}const act=p.action||'idle',dir=((Math.round(((p.facing||0)+Math.PI/2)/(Math.PI/4))%8)+8)%8;const frame=Math.floor(time*(act==='attack'?12:act==='run'?9:4))%m.frames;const selected=parts.map(slot=>{const id=gear[slot]?.appearance||m.defaults[p.classId]?.[slot];return{id,slot,it:gear[slot],entry:m.layers[id]}}).filter(a=>a.entry);let loaded=true;for(const a of selected){a.img=extraImage(a.entry[p.classId+'-'+act]||a.entry[act]||a.entry.idle);if(!a.img)loaded=false}if(!loaded){drawBase(p,time,x,y);return}const [cw,ch]=m.cell,height=112,width=height*cw/ch;for(const a of selected){ctx.save();const n=a.it?.enhance||0;if(n>=4){ctx.filter='brightness('+(1+n*.025)+')';ctx.shadowColor=n>=13?'#ecddff':n>=9?'#8de9ff':'#fff2ae';ctx.shadowBlur=2+(n-3)*.8;}const factor=a.img.width/(m.frames*cw);ctx.drawImage(a.img,frame*cw*factor,dir*ch*factor,cw*factor,ch*factor,x-width/2,y-height+height*(m.ground||12)/ch,width,height);ctx.restore()}const n=Math.max(0,...Object.values(gear).map(it=>it.enhance||0));if(n>=9){const t=time*2;for(let i=0;i<Math.min(8,n-7);i++){const a=t+i*2.4;ellipse(x+Math.sin(a)*24,y-45+Math.cos(a*1.3)*33,1+(n>=13?1:0),2,n>=13?'#f5dcff':'#b5edff')}}}

function drawMonsterArt(m,time,x,y){const spec=extraArt.manifest?.mobs?.[state.me.map];if(!spec)return false;const act=m.action||'idle',im=extraImage(spec.files[act]);if(!im)return false;const [cw,ch]=spec.cell,frame=Math.floor(time*(act==='attack'?12:act==='run'?9:4))%spec.frames,dir=((Math.round(((m.facing||0)+Math.PI/2)/(Math.PI/4))%8)+8)%8,height=105,width=height*cw/ch;ctx.drawImage(im,frame*cw,dir*ch,cw,ch,x-width/2,y-height+height*6/ch,width,height);return true}
