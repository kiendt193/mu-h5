'use strict';
const SLOTS=['weapon','helm','armor','pant','glove','boot','shield','ring1','ring2','necklace'];
// Use configured VIP/custom equipment, never invent item stats or models.
function vip(it){return /VIP/i.test([it.name,it.sourceName].join(' '));}
function excluded(it){return !it||it.kind!=='gear'||['wing','mount'].includes(it.slot)||it.rarity==='ancient'||Boolean(it.ancient)||vip(it);}
// Extended client item indexes beyond the classic equipment families.
const CUSTOM_FROM={0:26,1:11,2:16,3:11,4:24,5:14,6:17,7:40,8:40,9:40,10:40,11:40};
function custom(it){const [g,i]=String(it.definitionId||'').split(':').map(Number);return !vip(it)&&Boolean(it.custom||it.isCustom||/custom/i.test([it.name,it.sourceName,it.configSource].join(' '))||(Number.isInteger(g)&&Number.isInteger(i)&&CUSTOM_FROM[g]!==undefined&&i>=CUSTOM_FROM[g]));}
function level380(it){return Number(it.requiredLevel||it.sourceRequiredLevel)===380;}
function price(D,it){const ex={...it,rarity:'excellent'};delete ex.ancient;const power=D.power(ex);if(!Number.isFinite(power))return null;const base=Math.min(10000000,Math.max(100000,Math.round((power*1000+(ex.enhance||0)*15000)/10000)*10000));return base*(custom(it)?3:level380(it)?2:1);}
function create({D,actors,offers,offer}){
 const CLASSES=['knight','wizard','elf','gladiator','darklord','summoner','fighter'];
 const active=new Map(actors.map(p=>[p.user.character.classId,p]));
 const owners=CLASSES.map((classId,i)=>active.get(classId)||{aiIndex:100+i,user:{character:{classId,name:'Thương Nhân '+({knight:'Chiến Binh',wizard:'Pháp Sư',elf:'Tiên Nữ',gladiator:'Đấu Sĩ',darklord:'Chúa Tể',summoner:'Thuật Sĩ',fighter:'Thiết Binh'}[classId])}}});
 const pools=new Map();let generation=0;
 for(const p of owners){const c=p.user.character;for(const slot of SLOTS){let list=D.catalog.filter(it=>!excluded(it)&&it.slot===slot&&it.visualReady&&(it.classes?.length?it.classes.includes(c.classId):it.classId===c.classId)&&(!['weapon','shield'].includes(slot)||D.R.weaponAllowed(c,it)));if(!list.length&&slot==='ring2')list=pools.get(c.classId+':ring1')||[];pools.set(c.classId+':'+slot,list);}}
 function key(cls,it){return [cls,it.definitionId||it.key||it.name,it.slot,it.rarity,it.enhance].join(':');}
 function refill(){
  // Retain stock already offered; refills ensure class + slot coverage.
  for(const [id,o] of offers)if(excluded(o.item))offers.delete(id);
  const seen=new Set([...offers.values()].map(o=>key(o.classId,o.item)));
  let added=0;
  function add(p,slot,choices,offset){
   if(offers.size>=160||!choices?.length)return false;
   for(let n=0;n<choices.length;n++){
    const proto=choices[(Math.abs(offset)+n)%choices.length];
    const it={...structuredClone(proto),slot,id:require('crypto').randomUUID(),kind:'gear',classId:p.user.character.classId,enhance:0,rarity:'excellent',excellent:structuredClone((D.EX_OPTIONS||[]).slice(0,2+generation%3)),price:Math.max(1,proto.price||100)};
    delete it.ancient;
    if(seen.has(key(p.user.character.classId,it)))continue;
    const before=offers.size;offer(p,it);
    if(offers.size>before){seen.add(key(p.user.character.classId,it));added++;return true;}
   }
   return false;
  }
  // Prefer coherent five-piece armor sets: same Item.txt family/index across
  // helm/armor/pants/gloves/boots. Never invent models that don't exist.
  for(const p of owners){
   const cls=p.user.character.classId;
   const byIndex=new Map();
   for(const slot of ['helm','armor','pant','glove','boot']){
    for(const proto of pools.get(cls+':'+slot)||[]){
     const index=String(proto.definitionId||'').split(':')[1];
     if(index===undefined)continue;
     if(!byIndex.has(index))byIndex.set(index,new Map());
     if(!byIndex.get(index).has(slot))byIndex.get(index).set(slot,proto);
    }
   }
   const complete=[...byIndex.values()].filter(v=>v.size===5);
   if(complete.length){
    const group=complete[(generation+Math.max(0,p.aiIndex||0))%complete.length];
    for(const [slot,proto]of group)add(p,slot,[proto],0);
   }
  }
  // Guarantee at least one offer per possible class/slot even if there are
  // only two real seller AIs in the main town.
  for(const p of owners)for(const slot of SLOTS){
   const cls=p.user.character.classId,pool=pools.get(cls+':'+slot)||[];
   if([...offers.values()].some(o=>o.classId===cls&&o.item.slot===slot&&!excluded(o.item)))continue;
   add(p,slot,pool,generation*13+p.aiIndex*7+slot.length);
  }
  // Gradually rotate high-level and custom models. Gaps are reconsidered on
  // each subsequent refill as old offers expire or get purchased.
  for(const category of ['380','custom'])for(const p of owners){
   for(const slot of ['weapon','helm','armor','pant','glove','boot']){
    const pool=pools.get(p.user.character.classId+':'+slot)||[];
    const choices=pool.filter(category==='custom'?custom:level380);
    add(p,slot,choices,generation+p.aiIndex*3+slot.length);
   }
  }
  generation++;
  return added;
 }
 return {refill};
}
module.exports={create,SLOTS,custom,level380,excluded,price};
