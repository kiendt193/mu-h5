'use strict';
(()=>{
 const LIFE=1000,MAX=64,seen=new Map(),numbers=[];
 let scope=null;const format=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
 const oldApply=apply;
 apply=function(packet){
  if(state&&packet.now<state.now)return oldApply(packet);
  const result=oldApply(packet),next=packet.me?.id+':'+packet.me?.map;
  if(next!==scope){scope=next;numbers.length=0;seen.clear();}
  const now=performance.now();
  for(const [key,until]of seen)if(until<now)seen.delete(key);
  for(const hit of packet.damageHits119||[]){
   const age=packet.now-hit.at,key=hit.at+':'+hit.id;
   if(seen.has(key)||age<0||age>1400||hit.map!==packet.me?.map||!Number.isFinite(hit.amount)||hit.amount<=0)continue;
   seen.set(key,now+2000);
   const born=now-Math.min(age,500),same=numbers.filter(n=>n.target===hit.target&&now-n.born<500);
   const rise=t=>44*t+13*Math.sin(Math.PI*Math.min(1,t*2));
   let lift=same.length?Math.max(...same.map(n=>(n.lift||0)+rise((now-n.born)/LIFE)))-rise((now-born)/LIFE)+30:0;
   if(lift>120)lift=0;
   const lane=same.length%3-1;
   numbers.push({...hit,born,lane,lift});
  }
  if(numbers.length>MAX)numbers.splice(0,numbers.length-MAX);
  if(seen.size>256)for(const key of [...seen.keys()].slice(0,seen.size-256))seen.delete(key);
  return result;
 };
 function installDraw(){if(MU_FX.draw.damageNumbers1238)return;
 const oldDraw=MU_FX.draw;
 MU_FX.draw=function(context,...args){
  const result=oldDraw.call(this,context,...args),now=performance.now();
  for(let i=numbers.length-1;i>=0;i--)if(now-numbers[i].born>=LIFE)numbers.splice(i,1);
  if(window.MU_DAMAGE1239||!state||document.hidden||!$('#login')?.hidden||!numbers.length)return result;
  context.save();context.textAlign='center';context.textBaseline='middle';context.lineJoin='round';
  const project=args[2]||screen;
  for(const hit of numbers){
   const t=Math.max(0,(now-hit.born)/LIFE),actor=renderMobs.get(hit.target),pos=project(actor?.x??hit.x,actor?.y??hit.y);
   const top=typeof MU_ART!=='undefined'&&MU_ART.ready?112:58;
   const x=pos.x+hit.lane*(12+18*t),y=pos.y-top-hit.lift-44*t-13*Math.sin(Math.PI*Math.min(1,t*2));
   if(x<-100||x>w+100||y<-50||y>h+50)continue;
   context.save();context.translate(x,y);
   const pop=1+(hit.critical?0.32:0.12)*Math.sin(Math.PI*Math.min(1,t*3));context.scale(pop,pop);
   context.globalAlpha=t<.65?1:Math.max(0,(1-t)/.35);
   context.font='bold '+(hit.critical?19:15)+'px Arial, sans-serif';
   context.lineWidth=3;context.strokeStyle='#091018';
   const text=(hit.critical?'CRIT ':hit.kind==='pet'?'PET ':'HIT ')+format.format(hit.amount);
   context.fillStyle=hit.critical?'#ffd75b':hit.kind==='pet'?'#8de7ff':'#fff2dc';
   context.strokeText(text,0,0);context.fillText(text,0,0);context.restore();
  }
  context.restore();return result;
 };
 MU_FX.draw.damageNumbers1238=true;
 }
 window.MU_DAMAGE119_INSTALL=installDraw;installDraw();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)numbers.length=0;});
})();
