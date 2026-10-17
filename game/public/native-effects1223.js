'use strict';
(()=>{
 const N=MU_NATIVE_FX;
 const kinds={slash:'blade',twisting:'spin',rage:'quake',falling:'blade',deathstab:'deathstab',breath:'flame',thrust:'deathstab',uppercut:'blade',horizontal:'blade',fire:'fire',ice:'ice',evil:'spirit',meteor:'meteor',lightning:'lightning',inferno:'inferno',flame:'flame',aqua:'aqua',poison:'poison',tornado:'tornado',meteorstorm:'meteors',arrow:'arrow',multi:'multi',icearrow:'icearrow',starfall:'starfall',five:'five',heal:'heal',mgslash:'powerslash',mgfire:'fireburst',mgspirit:'spirit',spiral:'spiral',rays:'aqua',swordslash:'powerslash',mgball:'fire',mgtornado:'tornado',mgmeteor:'meteor',force:'forcewave',fireburst:'fireburst',firescream:'firescream',dlforce:'forcewave',fireblast:'fireblast',spark:'lightning',earthshake:'quake',sumfire:'fire',drain:'drain',chainlightning:'chainlightning',electricsurge:'lightning',redstorm:'tornado',rfstrike:'fist',ringblow:'fist',upperbeast:'fist',chaindriver:'fist',darkside:'darkside',dragonlore:'flame'};
 const duration=e=>e.projectile?.45:({spin:.75,blade:.48,fist:.55,lightning:.6,chainlightning:.8,spirit:1.1,drain:.85,ice:.95,inferno:.85,quake:.8,flame:.85}[kinds[e.skillId]||e.effect]||.72);
 MU_FX.duration=duration;
 // The original GPU models stay in use. Bitmap joints cover the remaining skills.
 function sprites(c,e,u,project){if(!N.manifest)return false;const type=kinds[e.skillId]||e.effect||'blade',s=project(e.fromX??e.x,e.fromY??e.y),t=project(e.x,e.y),sx=s.x,sy=s.y-32,tx=t.x,ty=t.y-30,theta=Math.atan2(ty-sy,tx-sx),travel=Math.min(1,u/.65),fade=Math.min(1,u*12)*Math.min(1,(1-u)*5);let draws=0;
 function paint(name,x,y,width,height=width,rotation=0,alpha=1){const meta=N.byName.get(name.toLowerCase()),im=meta&&N.images.get(meta.file);if(!im?.complete||!im.naturalWidth)return; c.save();c.translate(x,y);c.rotate(rotation);c.globalAlpha=fade*alpha;c.drawImage(im,-width/2,-height/2,width,height);c.restore();draws++;}
 function beam(name,a,b,width){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);const count=Math.max(1,Math.min(12,Math.ceil(len/24)));for(let i=0;i<count;i++){const f=(i+.5)/count;paint(name,a.x+dx*f,a.y+dy*f,width,Math.max(16,len/count+10),angle-Math.PI/2,.8);}}
 c.save();c.globalCompositeOperation='lighter';try{
  if(['blade','spin','powerslash','fist','darkside'].includes(type)){
   const ring=type==='spin',rad=ring?54:26,turn=ring?u*Math.PI*4:theta-1.3+u*2.5;for(let i=0;i<(ring?6:3);i++){const a=turn-i*.23;paint(type==='fist'?'strongp_r':'swordeff',sx+Math.cos(a)*rad,sy+Math.sin(a)*rad*.48,ring?58:46,ring?32:20,a,.7-i*.13);}if(u>.4)paint(type==='darkside'?'sou02':'swordeffor2',tx,ty,48,48,theta,1-u);
  }else if(type==='spirit'||type==='drain'){
   const targets=(e.targets?.length?e.targets:[{x:e.x,y:e.y}]).slice(0,6);for(let i=0;i<targets.length;i++){const p=project(targets[i].x,targets[i].y),a=type==='drain'?{x:p.x,y:p.y-30}:{x:sx,y:sy},b=type==='drain'?{x:sx,y:sy}:{x:p.x,y:p.y-30},f=travel;paint('jointspirit01',a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f-Math.sin(f*Math.PI)*18,70,9,Math.atan2(b.y-a.y,b.x-a.x),.85);}
  }else if(type==='lightning'||type==='chainlightning'){
   const points=[{x:sx,y:sy},...(e.targets?.length?e.targets:[{x:e.x,y:e.y}]).slice(0,type==='chainlightning'?5:1).map(p=>{const q=project(p.x,p.y);return{x:q.x,y:q.y-30};})];for(let i=1;i<points.length;i++)beam('jointthunder01',points[i-1],points[i],17+Math.sin(u*45)*3);
  }else if(type==='heal'){
   paint('magic_g',sx,s.y+2,90,42,u*.5);for(let i=0;i<5;i++)paint('sou01',sx+(i-2)*14,sy+22-u*55,22,36,0,.65);
  }else if(['arrow','multi','five','icearrow'].includes(type)){
   const count=type==='five'?5:type==='multi'?3:1;for(let i=0;i<count;i++){const raw=e.targets?.[i],p=raw?project(raw.x,raw.y):{x:tx+(i-(count-1)/2)*24,y:ty+30};const x=sx+(p.x-sx)*travel,y=sy+(p.y-30-sy)*travel;paint(type==='icearrow'?'bow_d':'bow_c',x,y,46,18,Math.atan2(p.y-30-sy,p.x-sx));if(type==='icearrow'&&travel===1)paint('ice',p.x,p.y-16,45,68,0,1-u);}
  }else if(['quake','inferno','aqua','tornado'].includes(type)){
   const x=type==='tornado'?sx+(tx-sx)*travel:sx,y=type==='tornado'?sy+(ty-sy)*travel:s.y;paint(type==='tornado'?'typhoon':type==='aqua'?'magic_a01':'groundeff',x,y,95+u*60,45+u*35,u*2);if(type==='inferno')for(let i=0;i<7;i++){const a=i*Math.PI*2/7;paint('flame01',sx+Math.cos(a)*50,s.y+Math.sin(a)*22-22,36,65,0,.75);}
  }else if(['meteor','meteors','starfall'].includes(type)){
   const count=type==='meteors'?3:1;for(let i=0;i<count;i++){const p=e.targets?.[i]?project(e.targets[i].x,e.targets[i].y):{x:tx+(i-(count-1)/2)*24,y:ty+30},f=Math.max(0,Math.min(1,(u-i*.07)/.6));paint('fire01',p.x-(1-f)*55,p.y-30-(1-f)*120,36,52,-.45);if(f===1)paint('fire02',p.x,p.y-25,65,65,0,1-u);}
  }else if(type==='ice'){
   for(let i=0;i<7;i++){const a=i*2.4,r=14+(i%3)*15;paint('ice',tx+Math.cos(a)*r,ty+Math.sin(a)*r*.4-(1-u)*45,34,70,0,.75);}
  }else if(type==='flame'||type==='firescream'){
   const count=type==='firescream'?3:6;for(let i=0;i<count;i++){const f=(i+.5)/count;paint('flame01',sx+(tx-sx)*f,sy+(ty-sy)*f-8,34,68,theta+Math.PI/2,.7);}
  }else if(type==='poison'){paint('sou01',tx,ty,55,60,u,.8);paint('magic_g',tx,t.y+2,85,40,-u,.55);
  }else{const x=sx+(tx-sx)*travel,y=sy+(ty-sy)*travel;paint(type==='deathstab'?'piercing':type==='forcewave'?'light01':'fire01',x,y,type==='deathstab'?26:44,type==='deathstab'?74:44,theta-Math.PI/2);if(travel===1)paint('fire02',tx,ty,45+u*35,45+u*35,u,.7);}
 }finally{c.restore();}return draws>0;
 }
 MU_FX.draw=function(c,list,dt,project){const alive=[],quality=typeof MU_VISUAL6==='undefined'?'medium':MU_VISUAL6.quality,limit=quality==='low'?16:quality==='high'?48:32;N.meshesThisFrame=0;N.maxMeshes=quality==='low'?12:36;N.install();const step=Math.min(.08,Math.max(0,Number(dt)||0));for(const e of list.slice(-limit)){e.t=(e.t||0)+step;const life=duration(e);if(e.t>=life)continue;alive.push(e);const u=e.t/life,type=kinds[e.skillId]||e.effect,fx={...e,effect:type==='blade'?'slash':type};if(!N.gpu(fx,u,project))sprites(c,fx,u,project);}return alive;};
 if(typeof window.MU_DAMAGE119_INSTALL==='function')window.MU_DAMAGE119_INSTALL();
 window.MU_EFFECTS1223={version:'12.23',kinds,sprites,duration};
})();
