'use strict';
const data=require('./seven-data.json');
const rates={knight:5,wizard:5,elf:5,gladiator:7,darklord:7,summoner:7,fighter:7};
function register(D,C){
 const P=require('./progression.cjs'),E=require('./equipment-config.cjs'),R=require('./combat-rules.cjs');
 for(const [id,row]of Object.entries(data.baselines)){
 const [strength,dexterity,vitality,energy,leadership,hp,mp,levelHp,levelMp,vitHp,eneMp]=row;
 const name=id==='summoner'?'Thuật sĩ':'Thiết binh';P.PRESETS[id]={id,sourceClass:id==='summoner'?5:6,name,base:{strength,dexterity,vitality,energy,leadership},hp,mp,levelHp,levelMp,vitHp,eneMp};
 C[id]={name,hp,damage:id==='summoner'?26:24,range:id==='summoner'?192:65,color:id==='summoner'?'#e1a3ff':'#ee976c'};
 P.GUIDE[id]=id==='summoner'?'Ưu tiên Năng lượng cho phép thuật; đủ Sức mạnh và Nhanh nhẹn để mặc đồ.':'Ưu tiên Sức mạnh và Thể lực cho cận chiến; đủ Nhanh nhẹn để mặc đồ.';
 }
 R.ALLOWED.summoner=['staff'];R.ALLOWED.fighter=['fist'];
 for(const [key,flags]of Object.entries(data.equipment)){
 const r=E.TABLE[key];if(!r)continue;r.classStages={...r.classStages,...flags};r.classes=[...new Set([...r.classes,...Object.keys(flags).filter(c=>flags[c]>0)])];
 const weapon=require('./rules/items.json')[key];if(weapon){weapon.classes=r.classes;if(key.startsWith('0:')&&+key.split(':')[1]>=32&&flags.fighter&&!r.classes.some(c=>c!=='fighter'))weapon.type='fist';}
 }
 for(const [key,src]of Object.entries(data.skills))if(R.SOURCE_SKILLS[key])R.SOURCE_SKILLS[key].classes={...R.SOURCE_SKILLS[key].classes,summoner:src.classes.summoner,fighter:src.classes.fighter};
 const specs={summoner:[[4,'sumfire','Quả cầu lửa','fire'],[214,'drain','Hút sinh lực','spirit'],[215,'chainlightning','Sét liên hoàn','lightning'],[216,'electricsurge','Bùng nổ điện','lightning'],[230,'redstorm','Bão đỏ','tornado']],fighter:[[19,'rfstrike','Đấm mạnh','slash'],[260,'ringblow','Quyền xung kích','force'],[261,'upperbeast','Thú quyền','uppercut'],[262,'chaindriver','Đấm liên hoàn','slash'],[263,'darkside','Ảnh quyền','spirit'],[264,'dragonlore','Long quyền','breath']]};
 for(const [cls,list]of Object.entries(specs))D.SKILLS[cls]=list.map(([sourceId,id,name,effect],index)=>{const s=data.skills[sourceId];if(!s||!s.classes[cls])throw Error('Sai kỹ năng nguồn '+sourceId);return{id,sourceId,name,sourceName:s.name,level:Math.max(1,s.level),requiredStage:s.classes[cls],sourceClassStage:s.classes[cls],mult:1.5+index*.3,mana:s.mana,requiredEnergy:s.energy,requiredLeadership:s.leadership,range:Math.max(65,s.range*32,s.radius*32),area:s.radius*32,sourceRange:s.range,sourceRadius:s.radius,cooldown:Math.max(1800,s.delay),effect,weaponTypes:R.ALLOWED[cls],targetType:s.range===0&&s.radius?'self':'target',description:name+' · '+(s.radius?'Gây sát thương trong vùng.':'Tấn công mục tiêu.'),icon:'../skill-icons/'+id+'.png',illustration:'../skill-icons/'+id+'.png'};});
 for(const list of Object.values(D.SKILLS))for(const sk of list){sk.icon='../skill-icons/'+sk.id+'.png';sk.illustration=sk.icon;}
 for(const row of data.renderItems){const proto=D.catalog.find(i=>i.key===row.key);if(!proto||!row.slot)continue;let it=D.catalog.find(i=>i.definitionId===row.definitionId&&i.appearance===row.key);if(!it){it={...proto};D.catalog.push(it);}Object.assign(it,{...row,kind:'gear',appearance:row.key,visualReady:true,price:Math.max(30,row.power*10),enhance:0,rarity:'normal',excellent:[]});E.sync(it);if(row.fist){const table=require('./rules/items.json');table[row.definitionId]={...(table[row.definitionId]||{}),type:'fist',classes:it.classes,twoHand:false,bothHands:false,skillIndex:0};}}
 for(const it of D.catalog){if(it.kind==='gear')E.sync(it);const r=R.rule(it);if(r){it.weaponType=r.type;it.twoHand=r.twoHand;it.bothHands=r.bothHands;}}
 const gain=P.gainXp;P.gainXp=function(c,amount){const n=gain(c,amount);c.unspentPoints+=n*((rates[c.classId]||7)-5);return n;};
 const suggest=P.suggestion;P.suggestion=function(c,item){if(item||!['summoner','fighter'].includes(c.classId))return suggest(c,item);const out=Object.fromEntries(P.FIELDS.map(k=>[k,0])),sequence=c.classId==='summoner'?['energy','energy','energy','dexterity','vitality']:['strength','strength','vitality','vitality','dexterity'];for(let i=0;i<c.unspentPoints;i++)out[sequence[i%5]]++;return out;};
 const q=require('./rules/quests512.json');for(const name of ['rows','objectives','rewards']){if(q[name].length!==data.quests[name].length)throw Error('Cấu hình nhiệm vụ không khớp');q[name].forEach((r,i)=>r.classes={...r.classes,...data.quests[name][i]});}
}
module.exports={register,rates};
