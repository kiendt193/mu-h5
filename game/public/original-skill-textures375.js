'use strict';
/* Original MU Skill.zip texture renderer: works on 2D maps as well as WebGL maps.
   Converted WebP assets are downloaded only when their skill is used. */
(()=>{
 if(typeof MU_FX==='undefined'||typeof MU_FX.draw!=='function')return;
 const ROOT='assets/skill-full/';
 const GROUP={
  blade:['swordeff','swordeffor2','knightst'],whirl:['swordeff','motion_blur','typhoon'],
  thrust:['piercing','swordeffor2','light01'],fire:['fire01','fire02','firemutt'],
  meteor:['fire02','blast2_r','groundeff'],ice:['ice','snow_p','magic_a01'],
  bolt:['eff_lightinga03','light01','windline'],spirit:['sou01','sou02','pinkwave'],
  heal:['magic_g','sou01','ring2'],arrows:['bow_c','bow_d','arrow'],
  force:['light01','chainring3','magic_a01'],quake:['groundeff','fury','ring2'],
  fist:['strongp_r','piercing','swordeff'],poison:['sou02','magic_g','groundeff'],
  magic:['magic_a01','magic_a02','sou02']
 };
 const OVERRIDE={
  twisting:'whirl',rage:'quake',falling:'thrust',deathstab:'thrust',lightning:'bolt',
  inferno:'fire',flame:'fire',tornado:'whirl',aqua:'magic',meteorstorm:'meteor',
  icearrow:'ice',starfall:'meteor',five:'arrows',spiral:'whirl',rays:'bolt',
  swordslash:'blade',mgtornado:'whirl',spark:'bolt',earthshake:'quake',
  firescream:'fire',chainlightning:'bolt',electricsurge:'bolt',redstorm:'whirl',
  ringblow:'fist',chaindriver:'fist',darkside:'spirit',dragonlore:'fire'
 };
 const R={version:'2.8.375',status:'loading',indexed:0,loaded:0,draws:0,
   lastSkill:null,files:new Map(),images:new Map(),loading:new Set(),failed:new Set(),active:true};
 window.MU_ORIGINAL_TEXTURE_FX=R;
 const profile=id=>typeof MU_PC_PROFILES==='undefined'?null:MU_PC_PROFILES[id];
 const group=id=>OVERRIDE[id]||profile(id)?.family||'magic';
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 fetch(ROOT+'manifest.json',{cache:'force-cache'}).then(r=>{
   if(!r.ok)throw Error('Skill pack HTTP '+r.status);
   return r.json();
 }).then(m=>{
   for(const row of m.assets||[]){
    if(row.type!=='texture'||!row.file)continue;
    const name=String(row.source||'').split('/').pop().replace(/\.[^.]+$/,'').toLowerCase();
    if(!R.files.has(name))R.files.set(name,row.file);
   }
   R.indexed=R.files.size;R.status=R.indexed?'ready':'empty';
 }).catch(error=>{R.status='unavailable';R.error=String(error)});
 function texture(name){
   if(R.images.has(name))return R.images.get(name);
   if(R.loading.has(name)||R.failed.has(name))return null;
   const file=R.files.get(name);if(!file)return null;
   R.loading.add(name);
   const im=new Image();im.decoding='async';
   im.onload=()=>{R.loading.delete(name);R.images.set(name,im);R.loaded=R.images.size};
   im.onerror=()=>{R.loading.delete(name);R.failed.add(name)};
   im.src=ROOT+file;return null;
 }
 function paint(c,im,x,y,w,h,rot,opacity){
  if(!im?.naturalWidth)return;
  c.save();c.translate(x,y);c.rotate(rot||0);c.globalAlpha=clamp(opacity,0,1);
  c.drawImage(im,-w/2,-h/2,w,h);c.restore();R.draws++;
 }
 function effect(c,e,project){
  const skill=e.skillId||e.effect;
  if(!skill||!e.skill&&!profile(skill))return;
  const category=group(skill),names=GROUP[category]||GROUP.magic;
  const sprites=names.map(n=>texture(n)).filter(Boolean);if(!sprites.length)return;
  const life=Math.max(.1,Number(MU_FX.duration(e))||.8);
  const u=clamp((Number(e.t)||0)/life,0,1);
  const opacity=clamp(u*9,0,1)*clamp((1-u)*5,0,1);
  if(opacity<=0)return;
  const a=project(e.fromX??e.x,e.fromY??e.y),b=project(e.x,e.y);
  if(!a||!b||![a.x,a.y,b.x,b.y].every(Number.isFinite))return;
  const low=typeof MU_VISUAL6!=='undefined'&&MU_VISUAL6.quality==='low';
  const quantity=low?2:4,travel=clamp(u*1.8,0,1),phase=u*Math.PI*2;
  const sx=a.x,sy=a.y-32,tx=b.x,ty=b.y-30,dx=tx-sx,dy=ty-sy;
  const [base,glow,detail]=sprites,primary=base||glow||detail;
  c.save();c.globalCompositeOperation='lighter';R.lastSkill=skill;
  try{
   if(category==='arrows'||category==='thrust'){
    const rays=category==='arrows'?Math.min(5,profile(skill)?.rays||1):1;
    for(let i=0;i<rays;i++){
     const pt=e.targets?.[i]?project(e.targets[i].x,e.targets[i].y):{x:tx+(i-(rays-1)/2)*22,y:ty};
     const x=sx+(pt.x-sx)*travel,y=sy+(pt.y-sy)*travel;
     paint(c,primary,x,y,low?44:58,26,Math.atan2(pt.y-sy,pt.x-sx),opacity*.9);
    }
    if(travel>.75&&glow)paint(c,glow,tx,ty,76,53,phase*.17,opacity*.55);
   }else if(['blade','whirl','fist'].includes(category)){
    const cx=category==='whirl'?sx:tx,cy=category==='whirl'?sy:ty;
    for(let j=0;j<quantity;j++){
     const angle=phase*(category==='whirl'?2.8:1)+j*Math.PI*2/quantity;
     const radius=category==='whirl'?66:38;
     paint(c,primary,cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius*.5,low?62:80,36,angle,opacity*.8);
    }
    if(glow)paint(c,glow,tx,ty,low?66:86,66,phase*.4,opacity*.65);
   }else if(category==='bolt'){
    let x=sx,y=sy;const targets=e.targets?.length?e.targets.slice(0,low?2:4):[{x:e.x,y:e.y}];
    for(const target of targets){
     const p=project(target.x,target.y),xx=p.x,yy=p.y-30;
     const steps=Math.min(low?8:14,Math.max(2,Math.ceil(Math.hypot(xx-x,yy-y)/25)));
     for(let j=0;j<steps;j++)paint(c,primary,x+(xx-x)*(j+.5)/steps,y+(yy-y)*(j+.5)/steps,23,34,Math.atan2(yy-y,xx-x)+Math.PI/2,opacity*.8);
     x=xx;y=yy;
    }
    if(glow)paint(c,glow,tx,ty,74,61,phase,opacity*.54);
   }else if(['heal','quake','force','magic'].includes(category)){
    const x=category==='heal'||category==='quake'?sx:tx;
    const y=category==='heal'||category==='quake'?sy+24:ty+18;
    paint(c,primary,x,y,95+u*52,42+u*30,phase*.12,opacity*.85);
    if(glow)paint(c,glow,x,y-28,48+u*35,56+u*30,-phase*.3,opacity*.6);
   }else{
    const cx=category==='spirit'?sx:tx,cy=category==='spirit'?sy:ty;
    for(let j=0;j<quantity;j++){
     const ang=j*2.399963+phase*.18;
     const rad=category==='meteor'?26+u*64:category==='ice'?17+u*48:category==='spirit'?27+u*43:20+u*32;
     const x=cx+Math.cos(ang)*rad,y=cy+Math.sin(ang)*rad*.54-(category==='meteor'?(1-travel)*105:0);
     paint(c,primary,x,y,low?40:55,low?50:71,ang*.2,opacity*.58);
    }
    if(glow)paint(c,glow,tx,ty,low?65:98,low?53:79,phase*.2,opacity*.7);
   }
   if(detail&&!low&&u>.35)paint(c,detail,tx,ty,55+u*37,46+u*20,-phase*.2,opacity*.3);
  }finally{c.restore()}
 }
 const prior=MU_FX.draw;
 MU_FX.draw=function(c,list,dt,project){
  const alive=prior.call(this,c,list,dt,project);
  if(R.status!=='ready'||!R.active)return alive;
  const limit=typeof MU_VISUAL6!=='undefined'&&MU_VISUAL6.quality==='low'?4:10;
  for(const e of alive.slice(-limit)){
   if(e.skill||profile(e.skillId))try{effect(c,e,project)}catch(err){
    if(!R.warned){R.warned=true;console.warn('Original Skill.zip draw error',err)}
   }
  }
  return alive;
 };
})();