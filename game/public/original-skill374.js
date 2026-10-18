'use strict';
/* Real MU original converted Skill/ assets. Installed only when pack exists.
 * Native 12.23 effects and 2.8.24 canvas fallback stay enabled.
 * Lazy model fetching avoids loading 166 original models on every phone.
 */
(()=>{
 const N=typeof MU_NATIVE_FX!=='undefined'?MU_NATIVE_FX:null;
 if(!N||typeof N.parts!=='function')return;
 const choice={
  slash:'swordforce',twisting:'swordforce',rage:'earthquake01',falling:'piercing',deathstab:'piercing',breath:'fire01',thrust:'piercing',uppercut:'swordforce',horizontal:'swordforce',
  fire:'fire01',ice:'ice01',evil:'skull',meteor:'blast01',lightning:'arrowthunder01',inferno:'inferno01',poison:'poison01',flame:'inferno01',tornado:'storm01',aqua:'magic01',meteorstorm:'blast01',
  arrow:'arrow01',multi:'arrowdouble01',icearrow:'arrowthunder01',starfall:'blast01',five:'arrownature01',heal:'magiccircle01',
  mgslash:'swordforce',mgfire:'fire01',mgspirit:'skull',spiral:'m_waves',rays:'laser01',swordslash:'swordforce',mgball:'ball01',mgtornado:'storm01',mgmeteor:'blast01',
  force:'waveforce',fireburst:'blast01',firescream:'darkfirescrem01',dlforce:'waveforce',fireblast:'blast01',spark:'arrow_spark',earthshake:'earthquake01',
  sumfire:'fire01',drain:'skull',chainlightning:'arrowthunder01',electricsurge:'arrowthunder01',redstorm:'storm01',
  rfstrike:'swordforce',ringblow:'circle01',upperbeast:'aurora',chaindriver:'piercing',darkside:'darklordskill',dragonlore:'fire01',
 };
 const R={status:'unavailable',list:null,loading:new Map(),ready:new Set(),failed:new Set(),playCount:0};
 window.MU_ORIGINAL_SKILL_FX=R;
 const base='assets/skill-full/';
 fetch(base+'model-index.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null).then(v=>{
   if(!v){R.status='waiting-for-asset-pack';return;}
   R.list=v;R.status='ready';console.info('MU original Skill.zip models available',Object.keys(v).length);
 }).catch(()=>{R.status='waiting-for-asset-pack';});
 const old=N.parts;
 function choose(name){const data=R.list?.[name];return data?.find(e=>e.vertices>0)||null;}
 function preload(name){
  if(!R.list||R.ready.has(name)||R.loading.has(name)||R.failed.has(name))return;
  const row=choose(name);if(!row){R.failed.add(name);return;}
  const promise=fetch(base+row.file,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Missing original MU model '+name);return r.json()}).then(meta=>{
   if(!meta.meshes?.length||!meta.bind?.length||!meta.animation?.clips)return;
   // Keep no more than 3,000 triangles per selected effect; skip missing textures.
   const kept=meta.meshes.filter(m=>m.texture&&m.count>0).slice(0,8);
   if(!kept.length)throw Error('Model lacks usable texture '+name);
   const spec={...meta,meshes:kept,source:meta.source||'Skill/'+name+'.bmd',
       file:'../skill-full/'+meta.file};
   spec.meshes=kept.map(m=>({...m,texture:'../skill-full/'+m.texture}));
   if(MU_LIVE?.manifest?.models){
      MU_LIVE.manifest.models['native-fx-full-'+name]=spec;
      R.ready.add(name);
   }
  }).catch(err=>{R.failed.add(name);console.warn('Original Skill model skipped:',name,err?.message||err)}).finally(()=>R.loading.delete(name));
  R.loading.set(name,promise);
 }
 N.parts=function(e,a){
  const parts=old.call(this,e,a);
  if(R.status!=='ready'||!MU_LIVE?.ready||MU_LIVE?.disabled)return parts;
  const name=choice[e.skillId]||choice[e.effect];
  if(!name)return parts;
  if(!R.ready.has(name)){preload(name);return parts;}
  const low=typeof MU_VISUAL6!=='undefined'&&MU_VISUAL6.quality==='low';
  if(low&&parts.length>=5)return parts;
  const sx=e.fromX??e.x,sy=e.fromY??e.y,tx=e.x,ty=e.y;
  if(![sx,sy,tx,ty].every(Number.isFinite))return parts;
  const t=Math.min(1,a*2),atTarget=['earthquake01','inferno01','circle01','magiccircle01','skull','aurora'].includes(name);
  const x=atTarget?tx:sx+(tx-sx)*t,y=atTarget?ty:sy+(ty-sy)*t;
  const angle=Math.atan2(ty-sy,tx-sx)+Math.PI/2;
  parts.push({key:'native-fx-full-'+name,x,y,z:atTarget?12:55,scale:low?.3:.42,angle,alpha:.7,phase:Math.min(.999,a),sourceOriginal:true});
  R.playCount++;
  return parts;
 };
})();
