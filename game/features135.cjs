'use strict';
function kill(c,m){if(m.worldBoss110||m.guildBoss135||m.eventBoss||m.adventure||c.adventureActive)return;c.combat135 ||= {kills:0};const s=c.combat135;if(!Number.isSafeInteger(s.kills)||s.kills<0)s.kills=0;s.kills++;if(s.kills>=500){const n=Math.floor(s.kills/500);s.kills%=500;c.phucDuyen=(c.phucDuyen||0)+n;}}
function act(c,b){if(b.action!=='lock')throw Error('Thao tác không hợp lệ');if(typeof b.locked!=='boolean')throw Error('Trạng thái khóa không hợp lệ');const it=(c.inventory||[]).find(i=>i.id===b.id);if(!it)throw Error('Chọn món trong túi');it.locked=b.locked;return{locked:it.locked,id:it.id};}
function install(S,D){if(S.features135)return;S.features135=true;const worn=(c,id)=>Object.values(c.gear||{}).some(i=>i?.id===id),guard=(c,id)=>{if((Array.isArray(id)?id:[id]).some(k=>k&&(c.inventory||[]).find(i=>i.id===k)?.locked))throw Error('Món đồ đang khóa');};const craft=S.craft;S.craft=function(c,recipe,id,...args){guard(c,id);if(id&&worn(c,id))throw Error('Trang bị đang mặc không được làm nguyên liệu');return craft.call(this,c,recipe,id,...args);};
 for(const key of ['sell','sellQuick'])if(typeof D[key]==='function'){const old=D[key];D[key]=function(c,id,...args){guard(c,id);return old.call(this,c,id,...args);};}
 if(D.quickEligible){const old=D.quickEligible;D.quickEligible=function(i,...args){return!!i&&!i.locked&&old.call(this,i,...args);};}
 for(const key of ['autoItems','sellLearnedBooks'])if(typeof D[key]==='function'){const old=D[key];D[key]=function(c,...args){const config=c.autoConfig;let altered=false;
 if(key==='autoItems'&&config?.equip&&Object.values(c.gear||{}).some(i=>i?.locked)){c.autoConfig={...config,equip:false};altered=true;if(D.equip&&D.power&&D.compatible)for(const i of [...c.inventory])if(!i.locked&&!c.gear[i.slot]?.locked&&!['wing','mount'].includes(i.slot)&&D.compatible(c,i)&&D.power(i)>D.power(c.gear[i.slot])){try{D.equip(c,i.id);}catch{}}}
 const locked=(c.inventory||[]).map((it,index)=>({it,index})).filter(x=>x.it.locked);if(locked.length)c.inventory=c.inventory.filter(i=>!i.locked);try{return old.call(this,c,...args);}finally{for(const{it,index}of locked)c.inventory.splice(Math.min(index,c.inventory.length),0,it);if(altered)c.autoConfig=config;}};}

}
module.exports={kill,act,install};
