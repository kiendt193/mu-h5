'use strict';
const SLOTS=new Set(['helm','armor','pant','glove','boot','weapon','shield']);
function install(D,report=require('./visual-audit811.json')){
 if(D.visualSafety811)return D.visualSafety811;
 const catalog=[...D.catalog],byId=new Map();for(const it of catalog)if(it.definitionId&&!byId.has(it.definitionId))byId.set(it.definitionId,it);
 const knownBad=new Set(['player-helmmale102_mage']);
 function blocked(it){if(it?.kind!=='gear'||!SLOTS.has(it.slot))return false;const proto=byId.get(it.definitionId),key=it.appearance||it.key||proto?.appearance||proto?.key;if(!key)return false;return knownBad.has(key)||!Object.hasOwn(report.verified,key);}
 const removed=catalog.filter(blocked);D.catalog.splice(0,D.catalog.length,...catalog.filter(it=>!blocked(it)));
 const compatible=D.compatible,migrate=D.migrate,equip=D.equip;
 D.compatible=(c,it)=>!blocked(it)&&compatible(c,it);
 D.equip=(c,id)=>{if(blocked(c.inventory?.find(it=>it.id===id)))throw Error('Trang bị bị loại do model hiển thị lỗi');return equip(c,id);};
 function clean(c){if(!c)return 0;let count=0;for(const name of ['inventory','warehouse','gearRecovery'])if(Array.isArray(c[name])){count+=c[name].filter(blocked).length;c[name]=c[name].filter(it=>!blocked(it));}for(const [slot,it]of Object.entries(c.gear||{}))if(blocked(it)){delete c.gear[slot];count++;}if(blocked(c.equipment))c.equipment=c.gear?.weapon||null;return count;}
 D.migrate=c=>{clean(c);const result=migrate(c);clean(c);return result;};
 // Defense in depth if another drop wrapper generates equipment outside the filtered catalog.
 const makeDrop=D.makeDrop;D.makeDrop=(...args)=>{const it=makeDrop(...args);return blocked(it)?null:it;};
 return D.visualSafety811={blocked,clean,removed:removed.map(it=>it.appearance||it.key)};
}
module.exports={install};
