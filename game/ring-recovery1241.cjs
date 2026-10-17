'use strict';
function ring(it,c,slot){return ['ring1','ring2'].includes(slot)&&it?.slot===slot&&it.rarity==='ancient'&&it.ancient?.classId===c.classId&&it.classes?.includes(c.classId)&&it.disabled!==true;}
function install(A){const previous=A.options;A.options=function(c){const rows=previous(c);for(const slot of ['ring1','ring2']){const it=c.gear?.[slot];if(!ring(it,c,slot)||A.setId(it,c.classId)!==it.ancient.setId)continue;rows.push({id:'ringHp1241',value:2,name:'Hồi 2% HP tối đa khi hạ quái'},{id:'ringMp1241',value:2,name:'Hồi 2% MP tối đa khi hạ quái'});}return rows;};}
function rate(options,id,percentId){const ratio=options.reduce((n,o)=>n+(o.id===id&&Number.isFinite(o.value)&&o.value>0?1/o.value:o.id===percentId&&Number.isFinite(o.value)&&o.value>0?o.value/100:0),0);return ratio>0?1/Math.min(1,ratio):0;}
module.exports={ring,install,rate};
