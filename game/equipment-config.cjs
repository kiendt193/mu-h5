'use strict';
const TABLE=require('./rules/equipment.json'),N=require('./item-names.cjs');
const SLOT_NAME={2:'helm',3:'armor',4:'pant',5:'glove',6:'boot'};
for(const r of Object.values(TABLE)){r.sourceName ||=r.name;r.name=N.name({...r,slot:SLOT_NAME[r.sourceSlot]});}

const SLOTS={0:'weapon',1:'shield',2:'helm',3:'armor',4:'pant',5:'glove',6:'boot',7:'wing',8:'mount',9:'necklace',10:'ring1',11:'ring2'};
function rule(it){return TABLE[it?.definitionId]||null;}
function sync(it){const r=rule(it);if(!r)return false;for(const k of ['classes','classStages','requiredLevel','requirements','name','drop'])it[k]=structuredClone(r[k]);if(it.slot==='mount'&&it.definitionId!=='13:4')it.requiredLevel=Math.max(300,it.requiredLevel);if(['13:8','13:9','13:12','13:13'].includes(it.definitionId))it.drop=true;it.configSource='Item.txt';return true;}
function allowed(c,it){const r=rule(it);if(!r)return !it?.definitionId&&!it?.key&&!it?.appearance&&it?.classId===c.classId;return r.classes.includes(c.classId)&&(c.classStage||1)>=(r.classStages?.[c.classId]||1)&&([10,11].includes(r.sourceSlot)?['ring1','ring2'].includes(it.slot):SLOTS[r.sourceSlot]===it.slot)&&!(c.classId==='gladiator'&&it.slot==='helm');}
module.exports={TABLE,SLOTS,rule,sync,allowed};
