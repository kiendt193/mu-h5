'use strict';
(function(){
 const advanced=new Set(['sumfire','drain','chainlightning','electricsurge','redstorm','rfstrike','ringblow','upperbeast','chaindriver','darkside','dragonlore']);
 const previous=MU_FX.draw;
 const duration=MU_FX.duration;MU_FX.duration=function(e){return e.skill&&MU_PC_PROFILES[e.skillId]?MU_PC_PROFILES[e.skillId].duration:duration(e);};
 function paint(c,e,project){
  const p=MU_PC_PROFILES[e.skillId];if(!p)return;
  const from=project(e.fromX??e.x,e.fromY??e.y),to=project(e.x,e.y);
  const age=Math.max(0,e.t||0),u=Math.min(1,age/p.duration),fade=Math.sin(u*Math.PI),seed=p.seed;
  if(fade<=0)return;
  const sx=from.x,sy=from.y-30,tx=to.x,ty=to.y-26,angle=Math.atan2(ty-sy,tx-sx),dx=tx-sx,dy=ty-sy;
  c.save();try{
   c.globalCompositeOperation='lighter';c.globalAlpha=fade*.65;c.strokeStyle=p.color;c.fillStyle=p.color;c.lineWidth=2;
   const line=(x,y,xx,yy,w=2)=>{c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
   const ring=(x,y,r,ratio=.45)=>{c.beginPath();c.ellipse(x,y,Math.max(1,r),Math.max(1,r*ratio),0,0,Math.PI*2);c.stroke();};
   const glow=(x,y,r)=>{const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,'#fff');g.addColorStop(.25,p.color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.fillStyle=p.color;};
   const impact=(x,y)=>{ring(x,y+20,8+u*30);glow(x,y,7+fade*15);};
   if(p.family==='fist'){
    const n=p.seed%3+2;for(let i=0;i<n;i++){const t=Math.min(1,Math.max(0,u*2.5-i*.18)),x=sx+dx*t,y=sy+dy*t+(i%2?7:-7);line(x-Math.cos(angle)*28,y-Math.sin(angle)*28,x,y,6-i);glow(x,y,9);}if(u>.3)impact(tx,ty);
    if(e.skillId==='upperbeast')for(let i=0;i<3;i++)line(tx+(i-1)*8,ty+25,tx+(i-1)*10,ty-u*55,3);
   }else if(p.family==='bolt'){
    const targets=(e.targets?.length?e.targets:[{x:e.x,y:e.y}]).slice(0,e.skillId==='chainlightning'?5:3);let a={x:sx,y:sy};
    for(const target of targets){const raw=project(target.x,target.y),b={x:raw.x,y:raw.y-26};let prev=a;for(let i=1;i<=9;i++){const n=i===9?0:Math.sin(age*40+seed+i*2.3)*10,q={x:a.x+(b.x-a.x)*i/9+n,y:a.y+(b.y-a.y)*i/9-n};line(prev.x,prev.y,q.x,q.y,i%2?3:1);prev=q;}impact(b.x,b.y);a=b;}
   }else if(p.family==='spirit'&&e.skillId==='drain'){
    for(let i=0;i<7;i++){const t=(u*1.7+i/7)%1,x=tx-dx*t,y=ty-dy*t+Math.sin(t*Math.PI*3+i)*10;glow(x,y,7);}ring(sx,sy+28,20+fade*10);impact(tx,ty);
   }else if(e.skillId==='darkside'){
    for(let i=0;i<4;i++){const a=angle+(i-1.5)*.3,t=Math.min(1,u*2);line(sx,sy,sx+Math.cos(a)*Math.hypot(dx,dy)*t,sy+Math.sin(a)*Math.hypot(dx,dy)*t,3);}impact(tx,ty);
   }else if(p.family==='quake'&&e.skillId==='dragonlore'){
    ring(sx,sy+30,20+u*85);for(let i=0;i<8;i++){const a=i*Math.PI/4,x=tx+Math.cos(a)*(20+u*48),y=ty+Math.sin(a)*20;line(x,y+20,x,y-50*fade,4);glow(x,y-30*fade,8);}impact(tx,ty);
   }else if(p.family==='whirl'&&e.skillId==='redstorm'){
    for(let i=0;i<8;i++){const a=u*10+i*Math.PI/4,x=tx+Math.cos(a)*(20+fade*50),y=ty+Math.sin(a)*23;line(x,y,x,y-30*fade,3);glow(x,y-15,8);}ring(tx,ty+22,22+u*70);
   }else{
    const centered=['whirl','quake','heal'].includes(p.family),cx=centered?sx:tx,cy=centered?sy:ty;
    const n=p.family==='arrows'?p.rays+2:5+seed%4;
    for(let i=0;i<n;i++){const a=angle+i*Math.PI*2/n+u*(p.family==='whirl'?8:2),r=8+u*(25+seed%24),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.48;
     line(x,y,x-Math.cos(a)*(5+fade*8),y-Math.sin(a)*5,1.5);if(i%2===0)glow(x,y,3+fade*3);
    }
    if(advanced.has(e.skillId)){const t=Math.min(1,u*2),x=sx+dx*t,y=sy+dy*t;glow(x,y,10+fade*10);if(t===1)impact(tx,ty);}
   }
  }finally{c.restore();}
 }
 MU_FX.pcPaint=paint;
 MU_FX.draw=function(c,list,dt,project){
  const quality=typeof MU_VISUAL6==='undefined'?'medium':MU_VISUAL6.quality;const normal=list.filter(e=>!e.skill||!advanced.has(e.skillId)).slice(-(quality==='low'?16:quality==='high'?48:32)),alive=previous.call(this,c,normal,dt,project),step=Math.min(.08,Math.max(0,Number(dt)||0));
  for(const e of list.slice(-this.max))if(e.skill&&advanced.has(e.skillId)){e.t=(e.t||0)+step;if(e.t<this.duration(e))alive.push(e);}
  const budget=quality==='low'?6:quality==='high'?20:12;
  for(const e of alive.filter(e=>e.skill&&MU_PC_PROFILES[e.skillId]).slice(-budget))paint(c,e,project);
  return alive;
 };
 if(typeof liveAnimation==='function'){
  const animation=liveAnimation;liveAnimation=function(p,time){const a=animation(p,time),profile=MU_PC_PROFILES[p.skillFx?.skillId];
   if(p.action==='attack'&&!p.riding&&profile&&typeof MU_NATIVE7!=='undefined'&&!MU_NATIVE7.skillFault&&MU_LIVE.manifest?.rig.clips[profile.clip]){
    const duration=Math.max(250,Math.min(650,profile.duration*750));a.phase=Math.min(.999,Math.max(0,(performance.now()-(p.actionTime??performance.now()))/duration));
   }return a;
  };
 }
})();
