'use strict';
// Baselines: supplied server Data/Character/DefaultClassInfo.txt, class 0..4.
const FIELDS=['strength','dexterity','vitality','energy','leadership'];
const LABELS={strength:'Sức mạnh',dexterity:'Nhanh nhẹn',vitality:'Thể lực',energy:'Năng lượng',leadership:'Mệnh lệnh'};
const BASELINES=require('./rules/class-baselines.json');const ids=['wizard','knight','elf','gladiator','darklord'];const names=['Pháp sư','Chiến binh','Cung thủ','Đấu sĩ','Chúa tể'];const rows=ids.map((id,i)=>[id,i,names[i],...BASELINES[id]]);
const PRESETS=Object.fromEntries(rows.map(([id,sourceClass,name,strength,dexterity,vitality,energy,leadership,hp,mp,levelHp,levelMp,vitHp,eneMp])=>[id,{id,sourceClass,name,base:{strength,dexterity,vitality,energy,leadership},hp,mp,levelHp,levelMp,vitHp,eneMp}]));
const GUIDE={knight:'Ưu tiên Sức mạnh để mặc vũ khí, Nhanh nhẹn để mặc giáp; Thể lực giúp sống lâu. Gợi ý 3 Sức mạnh / 1 Nhanh nhẹn / 1 Thể lực.',wizard:'Ưu tiên Năng lượng tăng phép và mana; đủ Sức mạnh/Nhanh nhẹn mặc đồ. Gợi ý 3 Năng lượng / 1 Nhanh nhẹn / 1 Thể lực.',elf:'Ưu tiên Nhanh nhẹn cho cung và phòng thủ; Sức mạnh vừa đủ mặc đồ. Gợi ý 3 Nhanh nhẹn / 1 Sức mạnh / 1 Thể lực.',gladiator:'Tóc trắng: lối cận chiến ưu tiên Sức mạnh; lối phép ưu tiên Năng lượng. Gợi ý cận chiến 3 Sức mạnh / 1 Nhanh nhẹn / 1 Thể lực.',darklord:'Mệnh lệnh dành riêng Dark Lord, tăng lực chỉ huy. Cân bằng Sức mạnh, Mệnh lệnh và Thể lực; gợi ý 2 Sức mạnh / 2 Mệnh lệnh / 1 Thể lực.'};
const WEIGHTS={knight:[3,1,1,0,0],wizard:[0,1,1,3,0],elf:[1,3,1,0,0],gladiator:[3,1,1,0,0],darklord:[2,0,1,0,2]};
function init(c){const p=PRESETS[c.classId];if(!p)throw Error('Hệ nhân vật chưa hỗ trợ');c.level=Math.min(400,Math.max(0,Math.floor(c.level??1)));if(!c.attributes){c.attributes={...p.base};c.unspentPoints=Math.max(0,c.level-1)*5;c.pointVersion=1;}if(c.pointVersion!==1)throw Error('Dữ liệu điểm không hợp lệ');}
function xpRequiredBeforeReset30(level){return level>=400?0:Math.max(1,level)*100;} // Preserve existing web EXP balance; supplied ExperienceTable is a reset/master EXP multiplier, not normal EXP thresholds.
function gainXp(c,amount){if(!Number.isSafeInteger(amount)||amount<0)throw Error('EXP không hợp lệ');if(c.level>=400){c.xp=0;return 0}c.xp=(c.xp||0)+amount;let levels=0;while(c.level<400&&c.xp>=xpRequired(c.level)){c.xp-=xpRequired(c.level);c.level++;c.unspentPoints+=5;levels++;}if(c.level===400)c.xp=0;return levels;}
function allocate(c,points){init(c);if(!points||typeof points!=='object'||Array.isArray(points)||Object.keys(points).some(k=>!FIELDS.includes(k)))throw Error('Chỉ số không hợp lệ');let total=0;for(const [k,v]of Object.entries(points)){if(!Number.isSafeInteger(v)||v<0||v>c.unspentPoints)throw Error('Điểm phải là số nguyên không âm');if(k==='leadership'&&v&&c.classId!=='darklord')throw Error('Chỉ Dark Lord được cộng Mệnh lệnh');total+=v}if(total<1||total>c.unspentPoints)throw Error('Không đủ điểm chưa cộng');for(const [k,v]of Object.entries(points))c.attributes[k]+=v;c.unspentPoints-=total;}
function suggestion(c,item){const points=Object.fromEntries(FIELDS.map(k=>[k,0]));let left=c.unspentPoints;if(item){const req=requirements(item);for(const k of FIELDS){if(k==='leadership'&&c.classId!=='darklord')continue;const n=Math.min(left,Math.max(0,(req[k]||0)-c.attributes[k]));points[k]=n;left-=n;}return points;}const weights=WEIGHTS[c.classId];for(let i=0;i<left;i++){let pos=i%5,sum=0;for(let k=0;k<5;k++){sum+=weights[k];if(pos<sum){points[FIELDS[k]]++;break}}}return points;}
function requirements(it){return it.requirements||{strength:0,dexterity:0,vitality:0,energy:0,leadership:0};}
function missing(c,it){return FIELDS.filter(k=>(c.attributes?.[k]||0)<(requirements(it)[k]||0)).map(k=>LABELS[k]+' '+requirements(it)[k]);}
function resources(c){const p=PRESETS[c.classId],a=c.attributes||p.base;return{maxHp:Math.floor(p.hp+Math.max(0,c.level-1)*p.levelHp+(a.vitality-p.base.vitality)*p.vitHp),maxMp:Math.floor(p.mp+Math.max(0,c.level-1)*p.levelMp+(a.energy-p.base.energy)*p.eneMp)};}
module.exports={FIELDS,LABELS,PRESETS,GUIDE,init,xpRequired,gainXp,allocate,suggestion,requirements,missing,resources};

/* MU EXP requirement 30 percent */
function xpBeforeUpdate6(level){const base=xpRequiredBeforeReset30(level);return base<=0?0:Math.max(1,Math.ceil(base*0.30));}

/* U6 EXP 60 percent */
function xpRequired(level){const xp=xpBeforeUpdate6(level);return xp<=0?0:Math.max(1,Math.ceil(xp*.6));}
