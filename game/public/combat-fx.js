'use strict';
// Runtime canvas effects: original converted textures over class-specific motion paths.
const MU_FX={textures:{},counts:{},draws:0,max:64,ready:false};
if(typeof Image!=='undefined')MU_FX.loading=Promise.all(['slash','spin','fire','ice','spirit','arrow','multi','icearrow'].map(k=>new Promise(resolve=>{const im=new Image();im.onload=()=>{MU_FX.textures[k]=im;resolve();};im.onerror=resolve;im.src='assets/mu03/fx/'+k+'.webp';}))).then(()=>MU_FX.ready=true);
const FX_FAMILIES={slash:'blade',falling:'blade',deathstab:'blade',thrust:'blade',uppercut:'blade',powerslash:'blade',swordslash:'blade',fireslash:'blade',spin:'spin',spiral:'spin',quake:'quake',meteor:'meteor',meteors:'meteor',starfall:'meteor',lightning:'lightning',spark:'lightning',rays:'lightning',ice:'ice',icearrow:'arrows',multi:'arrows',five:'arrows',arrow:'arrows',penetration:'arrows',spirit:'spirit',heal:'heal',tornado:'tornado',aqua:'aqua',poison:'poison',fire:'fire',flame:'flame',inferno:'flame',breath:'flame',fireburst:'burst',fireblast:'burst',firescream:'flame',force:'force',forcewave:'force'};
MU_FX.family=e=>FX_FAMILIES[e.effect]||'blade';
MU_FX.duration=e=>e.projectile?.65:e.skill?1.6:.6;
MU_FX.draw=function(ctx,list,dt,project){const alive=[];if(typeof MU_NATIVE_FX!=='undefined'){MU_NATIVE_FX.meshesThisFrame=0;MU_NATIVE_FX.install();}for(const e of list.slice(-this.max)){e.t=(e.t||0)+Math.min(.08,Math.max(0,dt));const duration=this.duration(e);if(e.t>=duration)continue;alive.push(e);const a=e.t/duration,type=e.effect||'slash',family=this.family(e),src=project(e.fromX??e.x,e.fromY??e.y),dst=project(e.x,e.y),x=src.x,y=src.y-34,tx=dst.x,ty=dst.y-30;const targets=(e.targets?.length?e.targets:[{x:e.x,y:e.y}]).slice(0,12);const color=['ice','arrows','aqua'].includes(family)?'#89dcff':family==='spirit'?'#cda0ff':family==='heal'?'#85ffc2':family==='poison'?'#94ed68':family==='lightning'?'#d2edff':family==='force'?'#b0a0ff':'#ffd696';if(this.originalDraw?.(ctx,e,a,project)){this.draws++;this.counts[type]=(this.counts[type]||0)+1;continue;}ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,a*9)*Math.min(1,(1-a)*5);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;
const line=(x,y,xx,yy,width=3)=>{ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();};
const ring=(x,y,r,ry=r*.45)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(1,r),Math.max(1,ry),0,0,Math.PI*2);ctx.stroke();};
const polygon=points=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();};
const glow=(x,y,r)=>{const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,'#ffffff');g.addColorStop(.28,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.fillStyle=color;};
const texture=(key,x,y,size)=>{const im=this.textures[key];if(!im)return;const count=im.width>im.height*2?Math.round(im.width/im.height):1,frame=Math.min(count-1,Math.floor(a*count)),sw=im.width/count;ctx.drawImage(im,sw*frame,0,sw,im.height,x-size/2,y-size/2,size,size);};
const flame=(x,y,size,phase)=>{ctx.fillStyle='#ff642d';polygon([[x-size*.5,y],[x-size*.25,y-size*.6],[x+Math.sin(phase)*size*.3,y-size],[x+size*.4,y-size*.4],[x+size*.5,y]]);ctx.fillStyle='#ffe19a';polygon([[x-size*.2,y],[x,y-size*.6],[x+size*.24,y]]);ctx.fillStyle=color;texture('fire',x,y-size*.4,size*.8);};
const impact=(x,y,size)=>{ring(x,y+20,size*(.2+a));glow(x,y,size*.55);};
// Caster cue makes a skill distinguishable from a normal attack even before impact.
if(e.skill){ctx.globalAlpha*=.7;ring(x,y+34,15+Math.sin(a*Math.PI)*20);ctx.globalAlpha/=.7;}
if(family==='blade'&&!e.skill){ctx.strokeStyle='#ffdfaa';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse((x+tx)/2,(y+ty)/2,28,15,Math.atan2(ty-y,tx-x),a*5,a*5+1.3);ctx.stroke();}
else if(family==='blade'){
 const angle=Math.atan2(ty-y,tx-x),phase=Math.min(1,a*2.4),impactAge=Math.max(0,(a-.28)/.72),heavy=['falling','uppercut','powerslash','swordslash'].includes(type);
 const thrust=['thrust','deathstab'].includes(type),cx=(src.x+dst.x)/2,cy=(src.y+dst.y)/2-34,r=heavy?85:64;
 // Three curved sword trails with a glowing core, swept over time rather than one flash.
 for(let trail=0;trail<3;trail++){
  const shift=trail*.18,start=angle-2.1+phase*2.3-shift,finish=start+.95;
  ctx.globalAlpha=Math.max(.05,1-trail*.28)*(1-impactAge*.6);
  for(const [width,tint]of [[18,'#248bff'],[10,'#71d9ff'],[3,'#ffffff']]){
   ctx.strokeStyle=tint;ctx.lineWidth=width;ctx.beginPath();
   if(thrust){const progress=Math.min(1,phase+trail*.07);ctx.moveTo(x-trail*8,y-trail*3);ctx.lineTo(x+(tx-x)*progress,y+(ty-y)*progress);}
   else ctx.ellipse(cx+trail*5,cy-trail*7,r-trail*6,(r-trail*6)*.65,angle,start,finish);
   ctx.stroke();
  }
  // Sword-shaped motion silhouette at the front of each arc.
  const ex=thrust?x+(tx-x)*phase:cx+Math.cos(finish+angle)*r,ey=thrust?y+(ty-y)*phase:cy+Math.sin(finish+angle)*r*.65;
  ctx.save();ctx.translate(ex,ey);ctx.rotate(angle+(thrust?0:finish));ctx.fillStyle='#effaff';polygon([[0,-4],[30,-2],[38,0],[30,2],[0,4]]);ctx.fillStyle='#75bfff';ctx.fillRect(-5,-8,4,16);ctx.restore();
 }
 ctx.globalAlpha=Math.min(1,impactAge*8)*(1-impactAge);
 if(impactAge>0){
  ctx.strokeStyle='#83dfff';ctx.lineWidth=4;ring(tx,ty+28,15+impactAge*(heavy?95:65));
  glow(tx,ty,28+Math.sin(impactAge*Math.PI)*30);
  // Impact bursts have deterministic particles, no allocation or random jitter per frame.
  for(let i=0;i<16;i++){const theta=i*Math.PI/8+Math.sin(i*17)*.18,travel=14+impactAge*(45+i%4*15),px=tx+Math.cos(theta)*travel,py=ty+Math.sin(theta)*travel*.65-impactAge*18;
   ctx.strokeStyle=i%2?'#f9f8ff':'#65caff';line(px,py,px-Math.cos(theta)*(8+i%4*3),py-Math.sin(theta)*8,2+i%3);
  }
  ctx.strokeStyle='#ffffff';line(tx-22,ty-25,tx+22,ty+25,4);line(tx+22,ty-25,tx-22,ty+25,4);
 }
 if(['fireslash','swordslash'].includes(type))for(let i=0;i<4;i++)flame(tx+(i-2)*22,ty+20,30+Math.sin(a*8+i)*12,a*9+i);
 ctx.strokeStyle=color;
}
else if(family==='spin'){const radius=Math.min(160,Math.max(60,(e.radius||96)*.8));for(let i=0;i<5;i++){const angle=a*Math.PI*7+i*Math.PI*.4;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(x,y+25,radius,radius*.45,0,angle,angle+1.1);ctx.stroke();const px=x+Math.cos(angle)*radius,py=y+25+Math.sin(angle)*radius*.45;glow(px,py,10);}texture('spin',x,y,130);}
else if(family==='quake'){const radius=Math.min(180,e.radius||130);ring(x,y+30,10+a*radius);ring(x,y+30,5+a*radius*.65);for(let i=0;i<12;i++){const angle=i*Math.PI/6,r=20+a*radius;line(x+Math.cos(angle)*20,y+30+Math.sin(angle)*10,x+Math.cos(angle)*r,y+30+Math.sin(angle)*r*.45,2);polygon([[x+Math.cos(angle)*r-7,y+Math.sin(angle)*r*.4],[x+Math.cos(angle)*r,y+Math.sin(angle)*r*.4-18*Math.sin(a*Math.PI)],[x+Math.cos(angle)*r+8,y+Math.sin(angle)*r*.4]]);}if(a<.45)glow(x,y+20,50);}
else if(family==='meteor'){for(let i=0;i<(type==='meteors'?6:type==='starfall'?3:1);i++){const px=tx+(i-2)*20,py=ty+(i%2)*14,t=Math.min(1,Math.max(0,a*2-i*.1)),xx=px-90*(1-t),yy=py-180*(1-t);line(xx-25,yy-60,xx,yy,6);flame(xx,yy,22+i*2,a*12);if(t===1)impact(px,py,50);}}
else if(family==='lightning'){const cx=type==='spark'?x:tx,cy=type==='spark'?y:ty;for(let beam=0;beam<(type==='spark'?5:type==='rays'?3:2);beam++){let px=x,py=y;const end=type==='spark'?{x:x+Math.cos(beam*1.26)*100,y:y+Math.sin(beam*1.26)*50}:{x:cx+(beam-1)*12,y:cy};for(let i=1;i<=8;i++){const t=i/8,xx=x+(end.x-x)*t+Math.sin(a*60+i*7+beam)*8,yy=y+(end.y-y)*t+Math.cos(a*50+i*9)*9;line(px,py,xx,yy,beam===0?4:2);px=xx;py=yy;}glow(end.x,end.y,22);}if(type==='lightning')line(tx-10,ty-130,tx,ty,5);}
else if(family==='ice'){ring(tx,ty+28,20+a*90);for(let i=0;i<9;i++){const angle=i*Math.PI*2/9,r=20+Math.sin(a*Math.PI)*55,px=tx+Math.cos(angle)*r,py=ty+Math.sin(angle)*r*.45,height=25+65*Math.sin(Math.min(1,a*2)*Math.PI);ctx.fillStyle=i%2?'#91e5ff':'#d4f5ff';polygon([[px-9,py],[px-5,py-height*.7],[px,py-height],[px+8,py-height*.6],[px+9,py]]);}texture('ice',tx,ty,130);}
else if(family==='arrows'){let dests=targets;const n=type==='five'?5:type==='multi'?3:1;if(dests.length<n)dests=Array.from({length:n},(_,i)=>({x:e.x+(i-(n-1)/2)*30,y:e.y}));for(const target of dests.slice(0,n)){const dest=project(target.x,target.y),t=Math.min(1,a*1.9),dx=dest.x-x,dy=dest.y-30-y,len=Math.hypot(dx,dy)||1,px=x+dx*t,py=y+dy*t;line(px-dx/len*28,py-dy/len*28,px,py,type==='penetration'?6:3);polygon([[px,py],[px-dx/len*12-dy/len*6,py-dy/len*12+dx/len*6],[px-dx/len*12+dy/len*6,py-dy/len*12-dx/len*6]]);if(type==='icearrow'){texture('icearrow',px,py,38);glow(px,py,17);}if(t===1)impact(dest.x,dest.y-30,25);}}
else if(family==='spirit'){for(let i=0;i<8;i++){const angle=a*Math.PI*4+i*Math.PI/4,r=25+a*100,px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r*.45;ctx.fillStyle='#c29aff';polygon([[px-10,py+8],[px,py-12],[px+12,py+8],[px+5,py+22],[px,py+14],[px-7,py+22]]);ctx.fillStyle='#fff6ff';ctx.fillRect(px-4,py,2,3);ctx.fillRect(px+4,py,2,3);texture('spirit',px,py,40);}}
else if(family==='heal'){for(let i=0;i<7;i++){const px=x+(i-3)*13,py=y+40-a*100;line(px-4,py,px+4,py,3);line(px,py-5,px,py+5,3);}ring(x,y+35,30+a*25);glow(x,y,40);}
else if(family==='tornado'){for(let i=0;i<9;i++){const r=12+i*6,py=ty+25-i*10,angle=a*20+i*.3;ctx.beginPath();ctx.ellipse(tx+Math.sin(angle)*10,py,r,r*.3,0,angle,angle+4.8);ctx.stroke();}texture('spin',tx,ty-20,100);}
else if(family==='aqua'){for(let i=0;i<6;i++){ring(tx,ty+10,15+a*90+i*7);const angle=a*10+i;glow(tx+Math.cos(angle)*70,ty+Math.sin(angle)*30-40,13);}}
else if(family==='poison'){for(let i=0;i<8;i++){const angle=i*.8+a*3,px=tx+Math.cos(angle)*(10+a*45),py=ty+Math.sin(angle)*20-a*35;ring(px,py,4+i%3,4+i%3);glow(px,py,10);}texture('spirit',tx,ty,65);}
else if(family==='flame'){const centered=['inferno','flame'].includes(type);for(let i=0;i<10;i++){const angle=i*Math.PI/5,r=35+Math.sin(a*Math.PI)*50,px=centered?x+Math.cos(angle)*r:x+(tx-x)*i/10,py=centered?y+30+Math.sin(angle)*r*.45:y+(ty-y)*i/10;flame(px,py+15,30+Math.sin(a*20+i)*15,a*14+i);}if(type==='inferno')ring(x,y+30,60+a*70);}
else if(family==='burst'){const t=Math.min(1,a*2);if(t<1){flame(x+(tx-x)*t,y+(ty-y)*t,28,a*14);}else{for(let i=0;i<8;i++){const angle=i*Math.PI/4,r=(a-.5)*110;flame(tx+Math.cos(angle)*r,ty+25+Math.sin(angle)*r*.4,40,a*14+i);}impact(tx,ty,70);}}
else if(family==='force'){const t=Math.min(1,a*2),px=x+(tx-x)*t,py=y+(ty-y)*t;for(let i=0;i<3;i++)ring(px-i*10,py,15+i*5);texture('spirit',px,py,55);if(t===1)impact(tx,ty,55);}
else{const t=Math.min(1,a*2);flame(x+(tx-x)*t,y+(ty-y)*t,38,a*12);if(t===1)impact(tx,ty,45);}
ctx.restore();this.draws++;this.counts[type]=(this.counts[type]||0)+1;}return alive;};
if(typeof module!=='undefined')module.exports={MU_FX,FX_FAMILIES};

// Native assets converted from the supplied client. Motion/timing is adapted to the web world scale.
const MU_NATIVE_FX={manifest:null,installed:null,images:new Map(),byName:new Map(),maxMeshes:48,meshesThisFrame:0,draws:0,loading:null};
MU_NATIVE_FX.load=function(){if(typeof Image==='undefined'||this.loading)return;this.loading=fetch('assets/native-fx/manifest.json').then(r=>{if(!r.ok)throw Error('Native FX manifest');return r.json();}).then(m=>{this.manifest=m;this.byName=new Map(Object.values(m.textures).map(t=>[t.source.split('/').pop().toLowerCase().replace(/\.oz[jt]$/,''),t]));return Promise.all(Object.values(m.textures).map(t=>{const file=t.file;return new Promise(resolve=>{const im=new Image();im.onload=()=>{this.images.set(file,im);resolve();};im.onerror=resolve;const run=()=>{im.src='assets/mu05/'+(t.spriteFile||file);};if(typeof MU_DOWNLOAD!=='undefined')MU_DOWNLOAD.run(()=>new Promise(done=>{const ok=im.onload,bad=im.onerror;im.onload=()=>{ok();done();};im.onerror=()=>{bad();done();};run();}),2);else run();});}));}).catch(()=>{});};
MU_NATIVE_FX.install=function(){if(!this.manifest||typeof MU_LIVE==='undefined'||!MU_LIVE.ready||MU_LIVE.disabled)return false;if(this.installed!==MU_LIVE.manifest){Object.assign(MU_LIVE.manifest.models,this.manifest.models);this.installed=MU_LIVE.manifest;for(const key of Object.keys(this.manifest.models))liveModel(key);}return true;};
MU_NATIVE_FX.parts=function(e,a){const sx=e.fromX??e.x,sy=e.fromY??e.y,tx=e.x,ty=e.y,angle=Math.atan2(ty-sy,tx-sx)+Math.PI/2,move=Math.min(1,a*2),x=sx+(tx-sx)*move,y=sy+(ty-sy)*move,parts=[];
const add=(model,px,py,z=0,scale=.625,rotation=angle,alpha=1)=>parts.push({key:'native-fx-'+model.toLowerCase(),x:px,y:py,z,scale,angle:rotation,alpha,phase:Math.min(.999,a)});
switch(e.effect){
case 'ice':for(let i=0;i<10;i++){const th=i*2.4,r=20+i*5;add('blizzard',tx+Math.cos(th)*r,ty+Math.sin(th)*r,Math.max(0,(1-a*2)*180+i*6),.28,th);}break;
case 'icearrow':add('ArrowThunder01',x,y,55,.625);if(move===1){add('Ice01',tx,ty,0,.45);for(let i=0;i<5;i++)add('Ice02',tx+Math.cos(i*1.26)*24,ty+Math.sin(i*1.26)*24,0,.25,i);}break;
case 'fire':add('Fire01',x,y,65,.4);break;
case 'meteor':add('Fire01',tx-80*Math.max(0,1-a*2),ty,Math.max(0,(1-a*2)*220),.625);break;
case 'meteors':case 'starfall':for(let i=0;i<(e.effect==='starfall'?1:2);i++)add('Blast01',tx+(i-.5)*30,ty,Math.max(0,(1-a*2)*220),1.2);break;
case 'tornado':add('Storm01',x,y,0,.625,angle+a*4);break;
case 'poison':add('Poison01',tx,ty,0,.625,angle+a*2);break;
case 'aqua':add('Magic01',sx,sy,70,.9,angle+a*6);break;
case 'inferno':add('Inferno01',sx,sy,0,.625,angle);add('Circle01',sx,sy,0,.8,angle+a*2);break;
case 'quake':if(e.sourceId===62){add('DarkLordSkill',sx,sy,0,.625,angle);}else{for(const name of ['EarthQuake01','EarthQuake02','EarthQuake03'])add(name,sx,sy,3,.625,0);for(let i=0;i<5;i++){const th=i*Math.PI*2/5,rad=60+Math.min(1,a*2)*60,px=sx+Math.cos(th)*rad,py=sy+Math.sin(th)*rad;add('EarthQuake04',px,py,3,.4,Math.PI/4);add('EarthQuake05',px,py,3,.4,Math.PI/4);if(a>.3){add('EarthQuake07',px,py,3,.625,th);add('EarthQuake08',px,py,3,.625,th);}}}break;
case 'multi':case 'five':case 'arrow':case 'penetration':{const count=e.effect==='five'?5:e.effect==='multi'?3:1;for(let i=0;i<count;i++){const t=e.targets?.[i]||{x:tx+(i-(count-1)/2)*25,y:ty},xx=sx+(t.x-sx)*move,yy=sy+(t.y-sy)*move;add(e.effect==='penetration'?'ArrowLaser01':'Arrow01',xx,yy,55,.625,Math.atan2(t.y-sy,t.x-sx)+Math.PI/2);}break;}
case 'force':add('Magic02',x,y,65,.8);break;
case 'forcewave':add('WaveForce',x,y,50,.35);break;
case 'fireburst':case 'fireblast':add('Piercing',x,y,65,.625);if(move===1)add('Fire01',tx,ty,0,.7);break;
case 'firescream':for(let i=-1;i<=1;i++){add('darkfirescrem01',x+i*25,y,40,.625,angle+i*.1745);add('darkfirescrem02',x+i*25,y,40,.625,angle+i*.1745);}break;
case 'deathstab':add('Piercing',x,y,55,.5);break;
case 'powerslash':case 'swordslash':add('SwordForce',sx,sy,55,.625,angle);break;
case 'spiral':add('m_Waves',x,y,40,.5,angle);add('m_Piercing',x,y,40,.5,angle);break;
}return parts;};
MU_NATIVE_FX.gpu=function(e,a,project){if(typeof screen==='undefined'||project!==screen||typeof MU_SCENE==='undefined'||!MU_SCENE.active||!this.install())return false;const parts=this.parts(e,a);if(!parts.length)return false;const loaded=parts.map(p=>({...p,model:liveModel(p.key)}));if(loaded.some(p=>!p.model||p.model.meshes.some(m=>!liveTexture(m.texture))))return false;if(this.meshesThisFrame+loaded.length>this.maxMeshes)return false;
const g=MU_LIVE.gl;let drawn=0;g.useProgram(MU_LIVE.program);g.depthMask(false);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE);try{for(const p of loaded){const alpha=Math.min(1,a*10)*Math.min(1,(1-a)*5)*p.alpha;g.uniform3f(MU_LIVE.loc.origin,p.x,p.y,MU_SCENE.height(state.character.map,p.x,p.y));const pose=livePose(p.model.animation,'0',p.phase);if(drawLiveMesh(p.model,pose,IDENTITY,p.angle,p.scale,p.z,[alpha,alpha,alpha],0)){drawn++;this.meshesThisFrame++;}}}finally{g.depthMask(true);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);}this.draws+=drawn;return drawn>0;};
// Bitmap-joint and weapon-blur paths use the original client images; no geometric streak substitute.
MU_NATIVE_FX.sprite=function(context,e,a,project){if(!this.manifest)return false;const family=MU_FX.family(e);const src=project(e.fromX??e.x,e.fromY??e.y),dst=project(e.x,e.y),sx=src.x,sy=src.y-35,tx=dst.x,ty=dst.y-35,move=Math.min(1,a*2);let count=0;
const image=(name,x,y,size,rotation=0,stretch=1)=>{const t=this.byName.get(name.toLowerCase())||Object.values(this.manifest.textures).find(t=>t.source.toLowerCase().endsWith('/'+name.toLowerCase()+'.ozj')),im=t&&this.images.get(t.file);if(!im)return;const transparent=window.MU_SKILL_ALPHA?.prepare(im);if(!transparent)return;context.save();context.translate(x,y);context.rotate(rotation);context.drawImage(transparent,-size/2,-size*stretch/2,size,size*stretch);context.restore();count++;};
context.save();context.globalCompositeOperation='lighter';context.globalAlpha=Math.min(1,a*10)*Math.min(1,(1-a)*5);
try{switch(family){
case 'blade':case 'spin':for(let i=0;i<5;i++){const angle=(family==='spin'?a*6.28:Math.atan2(ty-sy,tx-sx)-1+a*2)+(i-2)*.22;image('SwordEff',sx+Math.cos(angle)*40,sy+Math.sin(angle)*20,32+Math.sin(a*Math.PI)*20,angle);}if(a>.3)image('SwordEffor2',tx,ty,65);break;
case 'spirit':for(let i=0;i<4;i++){const angle=i*Math.PI/2+a*4,rad=20+a*110;image('JointSpirit01',sx+Math.cos(angle)*rad,sy+Math.sin(angle)*rad*.45,55,angle);}break;
case 'heal':image('magic_g',sx,sy+25,105,0,.7);for(let i=0;i<5;i++)image('sou01',sx+(i-2)*17,sy+20-a*65,30);break;
case 'lightning':for(let i=0;i<7;i++){const t=i/6;image('JointThunder01',sx+(tx-sx)*t,sy+(ty-sy)*t,36,Math.atan2(ty-sy,tx-sx));}break;
case 'flame':case 'fire':case 'burst':for(let i=0;i<(family==='flame'?8:1);i++){const t=family==='flame'?i/7:move;image('Flame01',sx+(tx-sx)*t,sy+(ty-sy)*t,60+a*25);}break;
default:{const n=family==='ice'?'ice':family==='arrows'?'arrow':family==='poison'?'sou01':family==='force'?'light01':family==='tornado'?'magic_a01':'SwordEffor2';image(n,tx,ty,100);break;}
}}finally{context.restore();}return count>0;};
MU_FX.originalDraw=function(context,e,a,project){if(!e.skill)return false;return MU_NATIVE_FX.gpu(e,a,project)||MU_NATIVE_FX.sprite(context,e,a,project);};
MU_NATIVE_FX.load();
if(typeof module!=='undefined')module.exports.MU_NATIVE_FX=MU_NATIVE_FX;
