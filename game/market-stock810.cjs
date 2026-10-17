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
 const owners=[...new Map(actors.map(p=>[p.user.character.classId,p])).values()],pools=new Map();let generation=0;
 for(const p of owners){const c=p.user.character;for(const slot of SLOTS){let list=D.catalog.filter(it=>!excluded(it)&&it.slot===slot&&it.visualReady&&(it.classes?.length?it.classes.includes(c.classId):it.classId===c.classId)&&(!['weapon','shield'].includes(slot)||D.R.weaponAllowed(c,it)));if(!list.length&&slot==='ring2')list=pools.get(c.classId+':ring1')||[];pools.set(c.classId+':'+slot,list);}}
 function key(cls,it){return [cls,it.definitionId||it.key||it.name,it.slot,it.rarity,it.enhance].join(':');}
 function refill(){
  // Exclude wings from this market, including stock left by version 8.10.
  for(const [id,o] of offers)if(excluded(o.item))offers.delete(id);
  const seen=new Set([...offers.values()].map(o=>key(o.classId,o.item)));let added=0;
  const tasks=[];
  // Seed custom and level-380 weapons/armor for every eligible class before general stock.
  for(const p of owners)for(const category of ['custom','380'])for(const slot of ['weapon','armor'])tasks.push({p,slot,category});
  for(let variant=0;variant<2;variant++)for(const p of owners)for(const slot of SLOTS)tasks.push({p,slot,variant});
  for(const {p,slot,category,variant=0} of tasks){
   if(offers.size>=160)break;
   const c=p.user.character,pool=pools.get(c.classId+':'+slot)||[];
   let choices=category?pool.filter(category==='custom'?custom:level380):pool;
   
   if(!choices.length)continue;
   const offset=(generation*13+p.aiIndex*7+variant*5+slot.length)%choices.length;
   // Try all candidates in the category to avoid duplicates blocking newer stock.
   for(let n=0;n<choices.length;n++){
    const proto=choices[(offset+n)%choices.length];
    const item={...structuredClone(proto),slot,id:require('crypto').randomUUID(),kind:'gear',classId:c.classId,enhance:0,rarity:'excellent',excellent:structuredClone((D.EX_OPTIONS||[]).slice(0,2+variant)),price:Math.max(1,proto.price||100)};
    delete item.ancient;
    if(seen.has(key(c.classId,item)))continue;
    const before=offers.size;offer(p,item);if(offers.size>before){seen.add(key(c.classId,item));added++;}break;
   }
  }
  generation++;return added;
 }
 return {refill};
}
module.exports={create,SLOTS,custom,level380,excluded,price};
