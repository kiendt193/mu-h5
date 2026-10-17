'use strict';
const CLASSES=['knight','wizard','elf','gladiator','darklord','summoner','fighter'];
const SLOT={weapon:0,shield:1,helm:2,armor:3,pant:4,glove:5,boot:6,necklace:9,ring1:10,ring2:11};
function install(D,E=require('./equipment-config.cjs')){
 if(E.unconfigured810)return;E.unconfigured810=true;
 const byKey=new Map(),byId=new Map();
 for(const proto of D.catalog){
  const source=E.rule(proto);
  if(proto.kind!=='gear'||!proto.visualReady||SLOT[proto.slot]===undefined||(source?.classes?.length||proto.classes?.length))continue;
  const row={...structuredClone(source||{}),classes:[...CLASSES],classStages:Object.fromEntries(CLASSES.map(c=>[c,1])),sourceSlot:SLOT[proto.slot],requiredLevel:proto.requiredLevel||proto.sourceRequiredLevel||1,requirements:structuredClone(proto.requirements||{}),name:proto.name,drop:proto.drop};
  const entry={row,slot:proto.slot};
  for(const key of [proto.key,proto.appearance].filter(Boolean))byKey.set(key,entry);
  if(proto.definitionId)byId.set(proto.definitionId,entry);
 }
 const match=it=>it?.kind==='gear'&&!rule(it)?.classes?.length&&(byId.get(it.definitionId)||byKey.get(it.key)||byKey.get(it.appearance));
 function mark(it){if(!match(it))return false;it.classes=[...CLASSES];it.classStages=Object.fromEntries(CLASSES.map(c=>[c,1]));return true;}
 const rule=E.rule,sync=E.sync,allowed=E.allowed;
 E.rule=it=>match(it)?.row||rule(it);
 E.sync=function(it){const ok=sync(it);return mark(it)||ok;};
 E.allowed=function(c,it){const entry=match(it);if(!entry)return allowed(c,it);mark(it);return CLASSES.includes(c.classId)&&(c.classStage||1)>=1&&(['ring1','ring2'].includes(entry.slot)?['ring1','ring2'].includes(it.slot):entry.slot===it.slot);};
 for(const proto of D.catalog)mark(proto);
 const migrate=D.migrate;
 D.migrate=function(c){if(c){for(const list of [c.inventory,c.warehouse,c.gearRecovery,Object.values(c.gear||{})])if(Array.isArray(list))for(const it of list)mark(it);mark(c.equipment);}return migrate(c);};
 return {count:byKey.size,mark};
}
module.exports={install,CLASSES};
