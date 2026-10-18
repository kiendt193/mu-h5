'use strict';
const TABLE=require('./rules/equipment.json'),N=require('./item-names.cjs');
const CATALOG=require('./public/assets/mu03/catalog.json');
const WEAPON_RULES=require('./rules/items.json');
const SOURCE_SLOT={weapon:0,shield:1,helm:2,armor:3,pant:4,glove:5,boot:6,wing:7,mount:8,necklace:9,ring1:10,ring2:11};
const ELF_HAND_WEAPONS=new Set(['sword','axe','mace','spear','staff','scepter']);
const ALL_CLASSES=['knight','wizard','elf','gladiator','darklord','summoner','fighter'];
const BY_KEY=new Map();
// High-tier and custom item models can exist in the original MU catalog without
// an entry in the smaller Item.txt rule export. Do not reject these verified assets.
let recovered=0;
for(const item of CATALOG){
 if(item.kind!=='gear'||!Object.hasOwn(SOURCE_SLOT,item.slot))continue;
 if(item.key&&!BY_KEY.has(item.key))BY_KEY.set(item.key,item);
 if(item.appearance&&!BY_KEY.has(item.appearance))BY_KEY.set(item.appearance,item);
 if(!item.definitionId||TABLE[item.definitionId])continue;
 const classes=Array.isArray(item.classes)&&item.classes.length?item.classes.slice():item.classId&&ALL_CLASSES.includes(item.classId)?[item.classId]:ALL_CLASSES.slice();
 TABLE[item.definitionId]={
  definitionId:item.definitionId,name:item.name||item.sourceName||'Trang bị',
  sourceName:item.sourceName||item.name||'Trang bị',
  classes,classStages:Object.fromEntries(classes.map(k=>[k,1])),
  requiredLevel:Math.max(1,Number(item.requiredLevel)||1),
  requirements:{strength:0,dexterity:0,vitality:0,energy:0,leadership:0,...item.requirements},
  sourceSlot:SOURCE_SLOT[item.slot],sourceGroup:item.sourceGroup??Number(item.definitionId.split(':')[0]),
  sourceIndex:item.sourceIndex??Number(item.definitionId.split(':')[1]),
  drop:item.drop!==false,configSource:'Original MU model/catalog'
 };
 recovered++;
}
// An Elf can hold a real one-handed melee weapon (including a dropped sword),
// while armor and bows still keep their class limits and level/stat gates.
for(const item of Object.values(TABLE)){
 if(item.sourceSlot!==0||!ELF_HAND_WEAPONS.has(WEAPON_RULES[item.definitionId]?.type))continue;
 if(!Array.isArray(item.classes))continue;
 if(!item.classes.includes('elf'))item.classes.push('elf');
 item.classStages ||= {};
 item.classStages.elf ||= 1;
}

const SLOT_NAME={2:'helm',3:'armor',4:'pant',5:'glove',6:'boot'};
for(const r of Object.values(TABLE)){r.sourceName ||=r.name;r.name=N.name({...r,slot:SLOT_NAME[r.sourceSlot]});}

const SLOTS={0:'weapon',1:'shield',2:'helm',3:'armor',4:'pant',5:'glove',6:'boot',7:'wing',8:'mount',9:'necklace',10:'ring1',11:'ring2'};
function rule(it){
 if(!it)return null;
 const known=TABLE[it.definitionId];
 if(known)return known;
 // Handle item models that have a key but no Item.txt identifier.
 const source=BY_KEY.get(it.key)||BY_KEY.get(it.appearance);
 if(!source||source.kind!=='gear'||source.slot!==it.slot)return null;
 if(source.definitionId)return TABLE[source.definitionId]||null;
 if(!Object.hasOwn(SOURCE_SLOT,source.slot))return null;
 const classes=source.classes?.length?source.classes.slice():source.classId&&ALL_CLASSES.includes(source.classId)?[source.classId]:ALL_CLASSES.slice();
 const meleeType=it.weaponType||((source.appearance||source.key||source.name||'').match(/sword|mace|axe|spear|staff|scepter|kiếm|đao|chùy|rìu|trượng|gậy/i)?.[0]||'').toLowerCase();
 if(source.slot==='weapon'&&ELF_HAND_WEAPONS.has(meleeType)&&!classes.includes('elf'))classes.push('elf');
 return {definitionId:null,name:source.name,sourceName:source.sourceName||source.name,
   classes,classStages:Object.fromEntries(classes.map(k=>[k,1])),
   requiredLevel:Math.max(1,Number(source.requiredLevel)||1),
   requirements:{strength:0,dexterity:0,vitality:0,energy:0,leadership:0,...source.requirements},
   sourceSlot:SOURCE_SLOT[source.slot],drop:source.drop!==false,configSource:'Original MU model/catalog'};
}
const BOW_CATALOG=require('./public/assets/mu03/catalog.json');const BOW_REQ=new Map(BOW_CATALOG.filter(it=>it.slot==='weapon'&&String(it.definitionId||'').startsWith('4:')).map(it=>[it.definitionId,it.requirements]));
function sync(it){const r=rule(it);if(!r)return false;for(const k of ['classes','classStages','requiredLevel','requirements','name','drop'])it[k]=structuredClone(r[k]);if(BOW_REQ.has(it.definitionId)&&it.slot==='weapon')it.requirements=structuredClone(BOW_REQ.get(it.definitionId));if(it.slot==='mount'&&it.definitionId!=='13:4')it.requiredLevel=Math.max(300,it.requiredLevel);if(['13:8','13:9','13:12','13:13'].includes(it.definitionId))it.drop=true;it.configSource='Item.txt';return true;}
function allowed(c,it){const r=rule(it);if(!r)return !it?.definitionId&&!it?.key&&!it?.appearance&&it?.classId===c.classId;return (r.classes||[]).includes(c.classId)&&(c.classStage||1)>=(r.classStages?.[c.classId]||1)&&([10,11].includes(r.sourceSlot)?['ring1','ring2'].includes(it.slot):BOW_REQ.has(it.definitionId)&&it.slot==='weapon'?true:SLOTS[r.sourceSlot]===it.slot)&&!(c.classId==='gladiator'&&it.slot==='helm');}
module.exports={TABLE,SLOTS,rule,sync,allowed};
