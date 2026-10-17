'use strict';
const crypto=require('node:crypto'),DEFINITIONS=require('./wings125.json');
function install({S,E,manifest,ready=()=>true,definitions=DEFINITIONS,prefix="wing125-",spriteReady=()=>false}){
 const enabled=definitions.filter(d=>{if(d.sprite127)return spriteReady(d);const m=manifest.models[d.appearance];return m?.animation&&m.meshes?.length&&ready(m,d);});
 for(const d of enabled)E.TABLE[d.definitionId]={...E.TABLE[d.definitionId],...d,classStages:d.classStages||Object.fromEntries(d.classes.map(cl=>[cl,3])),sourceSlot:7,drop:d.wingTier>=4?false:(E.TABLE[d.definitionId]?.drop??true)};
 if(!E.visualSync129){const priorSync=E.sync.bind(E);E.sync=function(it){const ok=priorSync(it),r=E.TABLE[it.definitionId];if(it.slot==='wing'&&r?.appearance&&r?.icon){it.appearance=r.appearance;it.icon=r.icon;it.wingTier=r.wingTier||it.wingTier;}return ok;};const priorInit129=S.init?.bind(S);if(priorInit129)S.init=function(c){const result=priorInit129(c);for(const it of [...Object.values(c.gear||{}),...(c.inventory||[]),...(c.warehouse||[])])if(it?.slot==='wing')E.sync(it);return result;};E.visualSync129=true;}
 const priorRecipes=S.recipes.bind(S),priorCraft=S.craft.bind(S),cache=new Map();
 const output=d=>({id:crypto.randomUUID(),kind:'gear',slot:'wing',...d,requirements:d.requirements||{},classStages:d.classStages||Object.fromEntries(d.classes.map(cl=>[cl,3])),power:d.wingTier*35,defense:d.sourceDefense||d.wingTier*25,price:d.wingTier*10000,enhance:0,rarity:'normal',excellent:[],drop:false,craftOnly125:true});
 function recipe(d,c){const tier=d.wingTier,firstCape=['13:30','12:49'].includes(d.definitionId);const lord=d.definitionId==='13:30';return require('./balance131.cjs').wing({id:prefix+d.definitionId.replace(':','-'),name:d.name,tier,level:tier===1?150:tier===2?firstCape?150:215:tier===3?380:400,stage:d.classStages?.[c.classId]||3,rate:tier===1?100:tier===2?40:tier===3?20:35,gold:lord?200000:tier===1?50000:tier===2?250000:tier===3?1000000:20000000,gems:lord?{chaos:2}:tier===1||tier===2?{chaos:1}:tier===3?{chaos:1,creation:1,life:1}:{bless:20,soul:20,life:10,chaos:5,creation:3},materials:lord?{crest:2}:tier===1?{}:tier===2?firstCape?{}:{feather:1}:tier===3?{condorfeather:1,condorflame:1}:{condorfeather:5,condorflame:5},consume:lord?null:tier===1||firstCape?{slot:'weapon',enhance:4,excellent:true}:{slot:'wing',tier:tier-1,enhance:tier===2?4:9},preview:{...output(d),id:'preview125-'+d.definitionId},custom120:!!d.custom127||tier===4,wing125:true});}
 S.recipes=function(c){if(!cache.has(c.classId))cache.set(c.classId,enabled.filter(d=>d.classes.includes(c.classId)).sort((a,b)=>a.wingTier-b.wingTier||a.definitionId.localeCompare(b.definitionId)).map(d=>recipe(d,c)));return [...cache.get(c.classId),...priorRecipes(c).filter(r=>!['wing1','wing2','wing3','cape2'].includes(r.id))];};
 S.craft=function(c,id,itemId,rng=Math.random){
  if(['wing1','wing2','wing3','cape2'].includes(id)){const tier=id==='wing1'?1:id==='wing3'?3:2;id=S.recipes(c).find(r=>r.wing125&&r.tier===tier)?.id;}
  if(typeof id!=='string')throw Error('Công thức không hợp lệ với hệ');
  if(!id.startsWith(prefix)){if(!S.recipes(c).some(r=>r.id===id))throw Error('Công thức không hợp lệ với hệ');return priorCraft(c,id,itemId,rng);}
  const r=S.recipes(c).find(r=>r.id===id);if(!r?.wing125)throw Error('Công thức không hợp lệ với hệ');
  if(c.level<r.level)throw Error('Cần cấp '+r.level);if((c.classStage||1)<r.stage)throw Error('Cần chuyển chức cấp '+r.stage);
  const it=r.consume?c.inventory.find(i=>i.id===itemId&&i.kind==='gear'&&!i.locked&&i.slot===r.consume.slot&&(i.enhance||0)>=r.consume.enhance&&(!r.consume.excellent||i.rarity==='excellent')&&(!r.consume.tier||i.wingTier===r.consume.tier)&& (i.slot!=='wing'||i.classes?.includes(c.classId))):null;
  if(r.consume&&(!it||Object.values(c.gear||{}).some(i=>i?.id===itemId)))throw Error('Chọn trang bị nguyên liệu đúng điều kiện, không khóa');
  if(!Number.isFinite(c.gold)||c.gold<r.gold)throw Error('Không đủ Zen');for(const[k,n]of Object.entries(r.gems))if(!Number.isFinite(c.gems?.[k])||c.gems[k]<n)throw Error('Thiếu ngọc '+k);for(const[k,n]of Object.entries(r.materials))if(!Number.isFinite(c.materials?.[k])||c.materials[k]<n)throw Error('Thiếu '+S.MATERIALS[k]);if(c.inventory.length-(it?1:0)>=40)throw Error('Túi đồ đã đầy');
  const item=output(enabled.find(d=>d.definitionId===r.preview.definitionId));E.sync(item);const roll=rng();if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Tỉ lệ không hợp lệ');const success=roll*100<r.rate;
  c.gold-=r.gold;for(const[k,n]of Object.entries(r.gems))c.gems[k]-=n;for(const[k,n]of Object.entries(r.materials))c.materials[k]-=n;if(it)c.inventory.splice(c.inventory.indexOf(it),1);if(success)c.inventory.push(item);return{success,rate:r.rate,name:r.name,item:success?item:null};
 };
 return{enabled:enabled.map(d=>d.definitionId)};
}
module.exports={install,DEFINITIONS};
