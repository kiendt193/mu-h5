'use strict';
/* MU H5 skill overlay 2.8.24.
 * Original converted MU GPU meshes/sprites stay the primary effect renderer.
 * This lightweight, bounded canvas pass makes every configured PC skill
 * visibly distinct even on mobile / when an original texture cannot load.
 */
(()=>{
 const PROFILES=typeof MU_PC_PROFILES==='object'?MU_PC_PROFILES:{};
 const previous=MU_FX.draw;
 const palette={blade:'#ffe3a0',thrust:'#e4f8ff',arrows:'#99ffd1',whirl:'#b9f1ff',fire:'#ffa556',ice:'#94e9ff',bolt:'#9ecfff',spirit:'#dbacff',heal:'#79ffbd',quake:'#edc588',meteor:'#ffbd73',magic:'#b8a2ff',force:'#b7a2ff',fist:'#ffcf87',poison:'#a8ff7d'};
 const kinds=Object.create(null);
 const norm=sk=>{
  let x=PROFILES[sk],family=x?.family||'magic';
  if(sk==='chainlightning'||sk==='electricsurge'||sk==='spark')family='bolt';
  else if(sk==='drain')family='spirit';
  else if(sk==='icearrow')family='ice';
  else if(sk==='firescream'||sk==='fireblast'||sk==='fireburst'||sk==='mgfire'||sk==='breath')family='fire';
  return family;
 };
 for(const k of Object.keys(PROFILES))kinds[k]=norm(k);
 const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 const line=(c,x,y,xx,yy,w)=>{c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke()};
 const ring=(c,x,y,rx,ry)=>{c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);c.stroke()};
 const glow=(c,x,y,r,tint)=>{
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.21,tint);g.addColorStop(1,'#0000');
  c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);
 };
 function paint(c,e,project,quality){
  const profile=PROFILES[e.skillId],family=kinds[e.skillId]||'magic',name=e.skillId||e.effect||'skill';
  const duration=Math.max(.35,Number(MU_FX.duration(e))||.75),t=clamp((e.t||0)/duration,0,1);
  if(t>=1||!Number.isFinite(t))return;
  const cast=project(e.fromX??e.x,e.fromY??e.y),impact=project(e.x,e.y),sx=cast.x,sy=cast.y-30,tx=impact.x,ty=impact.y-25;
  if(![sx,sy,tx,ty].every(Number.isFinite))return;
  const p=clamp(t*1.7,0,1),fade=Math.min(1,t*10)*Math.min(1,(1-t)*5),color=profile?.color||palette[family]||'#fff';
  const seed=profile?.seed||717,sign=seed%2?-1:1;
  const amount=quality==='low'?4:quality==='high'?13:8;
  c.save();
  try{
   c.globalCompositeOperation='lighter';c.globalAlpha=fade*.72;c.strokeStyle=color;c.fillStyle=color;c.lineCap='round';
   // Every attack has a clearly visible caster rune and impact; no full-screen flashes.
   ring(c,sx,sy+27,10+15*t,4+6*t);
   if(family==='heal'){
    for(let j=0;j<amount;j++){let angle=j*Math.PI*2/amount+t*1.4,x=sx+Math.cos(angle)*(15+t*28),y=sy+26+Math.sin(angle)*10-(j%3+t)*24;line(c,x-5,y,x+5,y,2);line(c,x,y-5,x,y+5,2);}
    ring(c,sx,sy+25,14+t*43,(14+t*43)*.4);glow(c,sx,sy,14+12*Math.sin(t*Math.PI),color);
   }else if(family==='bolt'){
    const targets=e.targets?.length?e.targets.slice(0,quality==='low'?2:5):[{x:e.x,y:e.y}];
    let ax=sx,ay=sy;
    for(let k=0;k<targets.length;k++){
     const tpos=project(targets[k].x,targets[k].y),bx=tpos.x,by=tpos.y-28;
     for(let j=1,lastx=ax,lasty=ay;j<=8;j++){
      const u=j/8,jitter=j===8?0:Math.sin(seed+j*7.11+t*29+k)*Math.min(13,5+Math.hypot(bx-ax,by-ay)*.025);
      const xx=ax+(bx-ax)*u+jitter,yy=ay+(by-ay)*u-jitter*.6;line(c,lastx,lasty,xx,yy,j%2?2.2:1.2);lastx=xx;lasty=yy;
     }ax=bx;ay=by;
    }
    glow(c,tx,ty,21,color);
   }else if(family==='arrows'||family==='thrust'||family==='force'){
    const rays=family==='arrows'?Math.max(1,Math.min(5,profile?.rays||1)):family==='force'?3:2;
    for(let j=0;j<rays;j++){
     const spread=(j-(rays-1)/2)*24,xx=sx+(tx+spread-sx)*p,yy=sy+(ty+(j%2?5:-5)-sy)*p;
     let angle=Math.atan2(ty-sy,tx-sx);
     line(c,xx-Math.cos(angle)*(18+j*2),yy-Math.sin(angle)*(18+j*2),xx,yy,2+j%2);
     c.beginPath();c.arc(xx,yy,2.5+j%2,0,Math.PI*2);c.fill();
     if(p>=1)ring(c,tx+spread,ty+18,12+(t-.4)*30,6+(t-.4)*14);
    }
   }else if(family==='fire'||family==='meteor'){
    const count=family==='meteor'?Math.min(5,profile?.rays?profile.rays+2:3):amount;
    for(let j=0;j<count;j++){
     const phase=(t*1.4+j/count)%1,angle=j*2.39996+seed*.01;
     const x=family==='meteor'?tx+(j-1)*23+(1-p)*(-60):sx+(tx-sx)*phase+Math.sin(angle)*18;
     const y=family==='meteor'?ty+(j%2)*12-(1-p)*110:sy+(ty-sy)*phase-Math.sin(phase*Math.PI)*30;
     glow(c,x,y,7+(j%3)*2,color);
     line(c,x-7,y+9,x+3,y-6,1.8);
    }
    if(p>.6)ring(c,tx,ty+18,12+(p-.6)*82,6+(p-.6)*31);
   }else if(family==='ice'){
    for(let j=0;j<amount;j++){
     const a=j*2.4,r=13+j%3*15+t*19,x=tx+Math.cos(a)*r,y=ty+Math.sin(a)*r*.43;
     const h=(12+j%4*7)*Math.sin(Math.min(1,t*2)*Math.PI*.5);
     line(c,x,y,x-5,y-h,2);line(c,x-5,y-h,x+6,y-h*.7,1);
    }ring(c,tx,ty+21,10+t*65,5+t*22);
   }else if(family==='spirit'||family==='magic'||family==='poison'){
    for(let j=0;j<amount;j++){
     const phase=t*8+2*Math.PI*j/amount+seed*.01,r=15+t*44;
     const x=tx+Math.cos(phase)*r,y=ty+Math.sin(phase)*r*.5-(1-t)*15;
     glow(c,x,y,7,color);ring(c,x,y,4+3*Math.sin(t*Math.PI),4+3*Math.sin(t*Math.PI));
    }
    if(name==='drain')line(c,tx,ty,sx,sy,3);
   }else if(family==='fist'){
    for(let j=0;j<3;j++){
     let u=clamp(t*2.1-j*.13,0,1),x=sx+(tx-sx)*u,y=sy+(ty-sy)*u+(j-1)*11;
     line(c,x-20*sign,y-8,x+8*sign,y+5,5-j);
    }
    if(p>.65)ring(c,tx,ty+20,12+t*62,6+t*28);
   }else if(family==='whirl'||family==='quake'||family==='blade'){
    const centered=family==='whirl'||family==='quake',cx=centered?sx:tx,cy=centered?sy:ty;
    const radius=family==='quake'?15+t*90:family==='whirl'?18+t*65:35;
    for(let j=0;j<(family==='quake'?3:amount);j++){
     if(family==='quake'){ring(c,cx,cy+28,radius+j*12,(radius+j*12)*.45);continue;}
     const a=t*(family==='whirl'?12:5)+j*2*Math.PI/amount,xx=cx+Math.cos(a)*radius,yy=cy+Math.sin(a)*radius*.46;
     line(c,xx,yy,xx-Math.cos(a+.8)*23,yy-Math.sin(a+.8)*12,2+(j%3===0?1:0));
    }
    glow(c,cx,cy,12+8*Math.sin(t*Math.PI),color);
   }else{
    ring(c,tx,ty+20,13+t*72,7+t*26);glow(c,tx,ty,17,color);
   }
  }finally{c.restore();}
 }
 // Installed after the native FX renderer; keep its original visuals intact.
 MU_FX.draw=function(context,list,dt,project){
  const alive=previous.call(this,context,list,dt,project);
  const quality=typeof MU_VISUAL6==='undefined'?'medium':MU_VISUAL6.quality;
  const max=quality==='low'?7:quality==='high'?20:12;
  let shown=0;
  for(let j=alive.length-1;j>=0&&shown<max;j--){
   const e=alive[j];if(!e?.skill)continue;
   try{paint(context,e,project,quality);shown++;}catch(error){if(!this.coverageError){console.warn('MU skill FX fallback unavailable',error);this.coverageError=true;}}
  }
  return alive;
 };
 const all=Object.keys(PROFILES);
 window.MU_SKILL_COVERAGE24={version:'2.8.24',families:kinds,skills:all,paint};
 if(typeof module!=='undefined')module.exports={families:kinds,skills:all,paint};
})();
