'use strict';
function wrapReset(reset){const original=reset.perform;reset.perform=function(c){const names=['gear','inventory','warehouse','gearRecovery','petConfig','riding'];const saved=new Map(names.filter(k=>Object.hasOwn(c,k)).map(k=>[k,structuredClone(c[k])]));const result=original(c);for(const[k,v]of saved)c[k]=v;c.equipment=c.gear?.weapon||null;c.resetRetainedGear=Object.values(c.gear||{}).filter(Boolean).map(it=>it.id);return result;};return reset;}
module.exports={wrapReset};
