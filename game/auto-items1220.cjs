'use strict';
const checked=new WeakMap();
function run(c,PET,BOOST,now=Date.now()){
 if(c.ai||!Array.isArray(c.inventory))return false;
 if(now-(checked.get(c)??-Infinity)<1000)return false;
 checked.set(c,now);let changed=false;
 c.gear ||= {};
 const alive=i=>i?.profile==='muun'&&(i.hp??100)>0&&(!i.expiresAt||i.expiresAt>now);
 if(!alive(c.gear.pet)&&!c.gear.pet?.locked){
  const options=c.inventory.filter(i=>alive(i)&&PET.allowed(c,i)).sort((a,b)=>(b.rank||0)-(a.rank||0)||(b.expiresAt||0)-(a.expiresAt||0));
  for(const item of options){try{PET.equip(c,item.id);c.petConfig={...c.petConfig,enabled:true,mode:c.petConfig?.mode||'assist'};changed=true;break;}catch{}}
 }
 const active=BOOST.multiplier(c,now);
 const boosts=c.inventory.filter(i=>!i.locked&&i.kind==='boost'&&BOOST.TYPES.some(t=>t.id===i.boostType)).sort((a,b)=>Number(b.boostType==='boost3')-Number(a.boostType==='boost3'));
 const item=boosts.find(i=>(BOOST.TYPES.find(t=>t.id===i.boostType)?.multiplier||1)>active);
 if(item){BOOST.use(c,item.id,now);changed=true;}
 return changed;
}
module.exports={run};
