'use strict';
// Skill-controlled Elf summons are independent of equipped pets and Dark Raven.
// Numbers and MP costs follow user-supplied Skill.txt (indices 30..36).
const SPAWNS=require('./worlds/spawns.json').records;
const defs=[
 {id:30,key:'elf-goblin',name:'Triệu tập yêu tinh',english:'Summon Goblin',mana:40,match:/^Goblin$/i,sourceId:26},
 {id:31,key:'elf-golem',name:'Triệu tập quỷ đá',english:'Summon Stone Golem',mana:70,match:/^Stone Golem$/i,sourceId:32},
 {id:32,key:'elf-assassin',name:'Triệu tập sát thủ',english:'Summon Assassin',mana:110,match:/^Assassin$/i},
 {id:33,key:'elf-yeti',name:'Triệu tập Elite Yeti',english:'Summon Elite Yeti',mana:160,match:/^Elite Yeti$/i},
 {id:34,key:'elf-darkknight',name:'Triệu tập Dark Knight',english:'Summon Dark Knight',mana:200,match:/^Dark Knight$/i},
 {id:35,key:'elf-bali',name:'Triệu tập Bali',english:'Summon Bali',mana:250,match:/^Bali$/i},
 {id:36,key:'elf-soldier',name:'Triệu tập chiến binh',english:'Summon Soldier',mana:350,match:/^Soldier$/i}
].map(v=>{
 const row=SPAWNS.find(r=>v.match.test(r.name));
 return Object.freeze({id:v.id,key:v.key,name:v.name,english:v.english,mana:v.mana,sourceId:row?.sourceId??v.sourceId??null,hasModel:!!row||!!v.sourceId});
});
const byId=new Map(defs.map(x=>[x.id,x]));
function skillKey(id){return 'elfsummon'+id}
function installSkills(skills,sources){
 for(const def of defs){
  const src=sources[def.id];
  if(!src||src.classes?.elf!==1)continue;
  const skill={id:skillKey(def.id),summonId:def.id,sourceId:def.id,name:src.vietnameseName||def.name,sourceName:src.name,english:src.name,
   level:Math.max(1,src.level||1),requiredStage:1,requiredEnergy:src.energy||0,requiredLeadership:src.leadership||0,
   mana:src.mana,mult:0,range:0,area:0,cooldown:10000,originalCooldown:10000,effect:'spirit',
   icon:'fx/spirit.webp',illustration:'icons/item-book04.webp',targetType:'self',support:'summon',hasModel:def.hasModel,
   description:'Triệu hồi '+(src.vietnameseName||def.name)+' đi theo, tự hỗ trợ tấn công quái. Chỉ một đồng hành tại một thời điểm.'};
  if(!skills.elf.some(x=>x.id===skill.id))skills.elf.push(skill);
 }
}
function ensureStarter(c){
 if(c.classId!=='elf')return false;
 c.skills||=[];let changed=false;
 // Introductory Goblin summon is unlocked once for existing and new Elf characters.
 if(!c.skills.includes(skillKey(30))){c.skills.push(skillKey(30));changed=true;}
 // Preserve any summon previously used before these skills joined the skill book system.
 const previous=byId.get(Number(c.elfSummonSkillId));
 if(previous?.hasModel&&!c.skills.includes(skillKey(previous.id))){c.skills.push(skillKey(previous.id));changed=true;}
 return changed;
}
function cast(p,id,now=Date.now()){
 const c=p.user.character,def=byId.get(Number(id));
 if(c.classId!=='elf')throw Error('Chỉ Tiên nữ Elf được triệu hồi bằng kỹ năng này');
 if(!def)throw Error('Kỹ năng triệu hồi không hợp lệ');
 if(!c.skills?.includes(skillKey(def.id)))throw Error('Chưa học kỹ năng triệu hồi này');
 if(!def.hasModel)throw Error('Thiếu tài nguyên quái triệu hồi: '+def.english);
 if(p.hp<=0)throw Error('Không thể triệu hồi khi đã gục');
 if(p.mp<def.mana)throw Error('Không đủ MP để triệu hồi '+def.name);
 if(p.elfSummon?.skillId===def.id&&p.elfSummon.map===c.map)return null;
 if(now<(p.elfSummonAt||0))throw Error('Triệu hồi đang hồi chiêu');
 p.mp-=def.mana;p.elfSummonAt=now+10000;
 c.elfSummonSkillId=def.id; // save selection, not a second inventory pet
 p.elfSummon={skillId:def.id,map:c.map,x:p.x+30,y:p.y+22,sourceId:def.sourceId,name:def.name,at:now,lastStrike:0,lastFollow:now,action:'idle',facing:p.facing||0};
 return p.elfSummon;
}
function restore(p,now=Date.now()){
 const c=p.user.character,def=byId.get(Number(c.elfSummonSkillId));
 if(c.classId!=='elf'||!def?.hasModel||p.elfSummon)return null;
 p.elfSummon={skillId:def.id,map:c.map,x:p.x+30,y:p.y+22,sourceId:def.sourceId,name:def.name,at:now,lastStrike:now,lastFollow:now,action:'idle',facing:p.facing||0};
 return p.elfSummon;
}
function view(p){
 const s=p.elfSummon,c=p.user.character;
 if(!s||s.map!==c.map||c.classId!=='elf'||p.hp<=0)return null;
 return {id:'elfpet:'+c.id,ownerId:c.id,ownerName:c.name,sourceId:s.sourceId,name:s.name,map:s.map,x:s.x,y:s.y,hp:100,maxHp:100,level:Math.max(1,c.level),facing:s.facing,action:s.action,ally:true};
}
function tick(p,mobs,now,options){
 const c=p.user.character;
 if(c.classId!=='elf'||p.hp<=0){p.elfSummon=null;return null}
 const s=p.elfSummon;
 if(!s)return null;
 if(s.map!==c.map){s.map=c.map;s.x=p.x+30;s.y=p.y+22;s.lastFollow=now;s.lastStrike=now;}
 if(now-(s.lastFollow||0)>=200){
  s.lastFollow=now;
  const tx=p.x+35,ty=p.y+25,d=Math.hypot(tx-s.x,ty-s.y);
  if(d>650){s.x=tx;s.y=ty;s.action='idle'}
  else if(d>35){const advance=Math.min(50,d-25);s.x+=(tx-s.x)/d*advance;s.y+=(ty-s.y)/d*advance;s.action='run';s.facing=Math.atan2(ty-s.y,tx-s.x)}
  else s.action='idle';
 }
 if(now-(s.lastStrike||0)<1400||options.safe(c.map,s.x,s.y))return null;
 const candidates=mobs.filter(m=>m.hp>0&&m.map===c.map&&Math.hypot(m.x-s.x,m.y-s.y)<215
  &&options.visible(p,m)&&options.eligible(p,m)&&!options.safe(c.map,m.x,m.y)
  &&options.segment(c.map,s.x,s.y,m.x,m.y));
 const focus=candidates.find(m=>m.id===p.petTarget)||candidates.reduce((best,m)=>!best||Math.hypot(m.x-s.x,m.y-s.y)<Math.hypot(best.x-s.x,best.y-s.y)?m:best,null);
 if(!focus)return null;
 s.lastStrike=now;s.action='attack';s.facing=Math.atan2(focus.y-s.y,focus.x-s.x);
 const damage=Math.max(2,Math.round(8+c.level*.35+(c.attributes?.energy||0)*.06));
 const before=focus.hp;focus.hp-=damage;focus.hitAt=now;focus.target=p.user.id;
 return {mob:focus,damage:Math.min(before,damage),pet:s};
}
module.exports={defs,byId,skillKey,installSkills,ensureStarter,cast,restore,tick,view};
