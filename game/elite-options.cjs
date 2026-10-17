'use strict';
// MU H5 2.8: additive, deterministic options for high-tier equipment.
// Existing excellence rolls, harmony, sockets and item IDs remain untouched.
const ELIGIBLE=new Set(['weapon','shield','helm','armor','pant','glove','boot','wing','necklace','ring1','ring2']);
const POOL={
 weapon:[
  ['speed','Tốc độ đánh +5%',5],
  ['health','HP tối đa +4%',4],
  ['mana','MP tối đa +4%',4],
  ['regenHp','Tự hồi 4 HP mỗi giây',4],
  ['regenMp','Tự hồi 3 MP mỗi giây',3],
  ['dodge','Tỉ lệ né đòn +3%',3],
  ['damage','Sát thương +3%',3],
  ['reduction','Giảm sát thương nhận +2%',2],
  ['critical','Chí mạng +5%',5]
 ],
 armor:[
  ['health','HP tối đa +4%',4],
  ['mana','MP tối đa +4%',4],
  ['reduction','Giảm sát thương nhận +3%',3],
  ['dodge','Tỉ lệ né đòn +3%',3],
  ['regenHp','Tự hồi 4 HP mỗi giây',4],
  ['regenMp','Tự hồi 3 MP mỗi giây',3],
  ['speed','Tốc độ đánh +3%',3],
  ['block','Tỉ lệ đỡ đòn +5%',5],
  ['defense','Phòng thủ +4%',4]
 ],
 accessory:[
  ['health','HP tối đa +3%',3],
  ['mana','MP tối đa +3%',3],
  ['regenHp','Tự hồi 3 HP mỗi giây',3],
  ['regenMp','Tự hồi 3 MP mỗi giây',3],
  ['dodge','Tỉ lệ né đòn +2%',2],
  ['reduction','Giảm sát thương nhận +2%',2],
  ['speed','Tốc độ đánh +3%',3],
  ['critical','Chí mạng +3%',3]
 ]
};
const VERSION=2;
function target(it,equipped=false){
 if(!it||it.kind!=='gear'||!ELIGIBLE.has(it.slot))return 0;
 const level=Math.max(0,Number(it.requiredLevel)||0,Number(it.sourceDropLevel)||0);
 const rare=it.rarity==='excellent'||it.rarity==='ancient';
 if(equipped)return rare?Math.max(6,level>=350?6:level>=250?5:4):Math.max(3,level>=350?3:level>=250?2:0);
 if(level>=350)return rare?6:3;
 if(level>=250)return rare?5:2;
 if(level>=180&&rare)return 4;
 return 0;
}
function hash(value){
 let h=2166136261;const s=String(value);
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
 return h>>>0;
}
function add(it,equipped=false){
 const targetCount=target(it,equipped);
 if(!targetCount)return false;
 it.eliteOptions=Array.isArray(it.eliteOptions)?it.eliteOptions:[];
 const all=[...(it.excellent||[]),...(it.baseOptions||[]),...it.eliteOptions].filter(x=>x&&typeof x.id==='string');
 const used=new Set(all.map(x=>x.id));
 let needed=targetCount-used.size;
 if(needed<=0)return false;
 const pool=it.slot==='weapon'?POOL.weapon:['ring1','ring2','necklace'].includes(it.slot)?POOL.accessory:POOL.armor;
 const start=hash(it.id||it.definitionId||it.key||it.name)%pool.length;
 const stride=pool.length>8?5:3;
 let changed=false;
 for(let i=0;i<pool.length&&needed>0;i++){
  const row=pool[(start+i*stride)%pool.length];
  if(used.has(row[0]))continue;
  const [id,name,value]=row;
  it.eliteOptions.push({id,name,value,origin:'elite2026'});
  used.add(id);needed--;changed=true;
 }
 return changed;
}
function updateCharacter(c){
 let changed=false;
 const items=[...(c.inventory||[]),...(c.warehouse||[]),...(c.gearRecovery||[])];
 for(const it of items)if(it&&add(it))changed=true;
 for(const it of Object.values(c.gear||{}))if(it&&add(it,true))changed=true;
 if(c.eliteOptionsVersion!==VERSION){c.eliteOptionsVersion=VERSION;changed=true}
 return changed;
}
function install(D){
 if(D.eliteOptionsInstalled)return;
 D.eliteOptionsInstalled=true;
 const priorMigrate=D.migrate;
 D.migrate=function(c,...args){const result=priorMigrate(c,...args);updateCharacter(c);return result};
 const priorDrop=D.makeDrop;
 D.makeDrop=function(...args){const item=priorDrop(...args);if(item)add(item);return item};
 const priorEquip=D.equip;
 D.equip=function(c,...args){const result=priorEquip(c,...args);updateCharacter(c);return result};
 const priorAuto=D.autoItems;
 D.autoItems=function(c,...args){const result=priorAuto(c,...args);updateCharacter(c);return result};
}
module.exports={VERSION,POOL,target,add,updateCharacter,install};
