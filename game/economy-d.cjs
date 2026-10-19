'use strict';
// MU H5 Package D: server-authoritative item economy. All operations check
// balances and item identity before touching persistent character data.
// Never changes appearance, class requirements, slot or item UUID.
const GEM_NAMES={bless:'Bless',soul:'Soul',chaos:'Chaos',life:'Life',creation:'Creation'};
const TYPES=['weapon','shield','helm','armor','pant','glove','boot','wing','mount','ring1','ring2','necklace'];
const socketRules={
 weapon:['bless','soul','life','creation'],shield:['bless','soul','life'],helm:['bless','life'],armor:['bless','life'],pant:['bless','life'],glove:['soul','life'],boot:['soul','life'],
 wing:['soul','creation'],mount:['life','creation'],ring1:['creation'],ring2:['creation'],necklace:['creation']
};
const socketsMax=s=>['weapon','wing'].includes(s)?3:['shield','armor','mount'].includes(s)?2:1;
const safe=(n)=>Number.isSafeInteger(n)&&n>=0;
const owned=(c,id)=>[...(c.inventory||[]),...Object.values(c.gear||{})].find(it=>it&&it.id===id)||null;
function validate(c){if(!safe(c.gold)||!c.gems||!Object.values(c.gems).every(safe))throw Error('Dữ liệu Zen hoặc ngọc không hợp lệ');}
function charge(c,cost,gems={}){
 if(!safe(cost)||c.gold<cost)throw Error('Không đủ Zen ('+cost.toLocaleString('vi-VN')+')');
 for(const [gem,count] of Object.entries(gems))if(!GEM_NAMES[gem]||!safe(count)||(c.gems[gem]||0)<count)throw Error('Thiếu ngọc '+(GEM_NAMES[gem]||gem));
 c.gold-=cost;for(const [gem,count] of Object.entries(gems))c.gems[gem]-=count;
}
function tierCost(it){const tier=it.economyTierD||0;return [150000,350000,900000][tier]||0;}
function options(it){
 let rows=[];
 for(const gem of it.socketsD||[]){
  if(gem==='bless')rows.push({id:'flatDefense',name:'Khảm Bless: Phòng thủ +4',value:4});
  if(gem==='soul')rows.push({id:'flatDamage',name:'Khảm Soul: Sát thương +4',value:4});
  if(gem==='life')rows.push({id:'health',name:'Khảm Life: HP +2%',value:2});
  if(gem==='creation')rows.push({id:'damage',name:'Khảm Creation: Sát thương +1%',value:1});
 }
 const tier=it.economyTierD||0,rank=it.companionRankD||0;
 if(tier)rows.push({id:it.slot==='weapon'?'flatDamage':'flatDefense',name:'Phẩm cấp '+tier+' · Thuộc tính +'+(tier*6),value:tier*6});
 if(rank&&it.slot==='wing')rows.push({id:'damage',name:'Huấn luyện cánh +'+rank+' · ST +'+rank+'%',value:rank});
 if(rank&&it.slot==='mount')rows.push({id:'defense',name:'Huấn luyện thú cưỡi +'+rank+' · Thủ +'+rank+'%',value:rank});
 return rows;
}
function sync(it){
 if(!it||it.kind!=='gear')return;
 it.socketsD=Array.isArray(it.socketsD)?it.socketsD.filter(x=>typeof x==='string'&&GEM_NAMES[x]).slice(0,socketsMax(it.slot)): [];
 it.economyTierD=safe(it.economyTierD)?Math.min(3,it.economyTierD):0;
 it.companionRankD=safe(it.companionRankD)?Math.min(10,it.companionRankD):0;
 it.dOptions=options(it);
}
function view(c){
 const items=[...(c.inventory||[]),...Object.values(c.gear||{})].filter(it=>it?.kind==='gear'||it?.kind==='pet');
 return {maxLevel:15,tiers:3,companionMax:10,forgeRecipes:[
 {id:'jewelFusion',name:'Dung luyện Ngọc Sinh Mệnh',gold:100000,gems:{bless:5,soul:5,chaos:1},output:'1 Life'}
 ],materials:c.materials||{},items:items.map(it=>({
 id:it.id,name:it.name,slot:it.slot,kind:it.kind,locked:!!it.locked,
 enhance:it.enhance||0,tier:it.economyTierD||0,rank:it.kind==='pet'?(it.trainingLevelD||0):(it.companionRankD||0),
 socketCost:15000*((it.socketsD?.length||0)+1)*Math.max(1,(it.enhance||0)+1),reforgeCost:tierCost(it),reforgeGems:[{bless:2,chaos:1},{soul:3,chaos:2},{life:5,creation:2,chaos:3}][it.economyTierD||0]||{},trainCost:(it.kind==='pet'?20000:it.slot==='wing'?100000:75000)*(((it.kind==='pet'?it.trainingLevelD:it.companionRankD)||0)+1)**2,
 sockets:Array.isArray(it.socketsD)?it.socketsD:[],maxSockets:socketsMax(it.slot),
 allowedGems:socketRules[it.slot]||[],worth:it.price||0
 }))};
}
function act(c,b){
 if(!b||typeof b!=='object')throw Error('Thao tác không hợp lệ');
 validate(c);const kind=b.kind;
 if(kind==='jewelFusion'){
  charge(c,100000,{bless:5,soul:5,chaos:1});
  c.gems.life=(c.gems.life||0)+1;
  return {kind,success:true,name:'Dung luyện Ngọc Sinh Mệnh',cost:100000};
 }
 if(typeof b.id!=='string'||b.id.length>128)throw Error('Mã trang bị không hợp lệ');
 const it=owned(c,b.id);
 if(!it)throw Error('Không tìm thấy vật phẩm');
 if(it.locked||it.bound&&kind==='reforgeD')throw Error('Vật phẩm đang bị khóa hoặc ràng buộc');
 const isGear=it.kind==='gear';
 if(kind==='socketD'){
  if(!isGear||!socketRules[it.slot])throw Error('Trang bị này không thể khảm');
  const gem=b.gem;
  if(typeof gem!=='string'||!socketRules[it.slot].includes(gem))throw Error('Loại ngọc không tương thích');
  const current=Array.isArray(it.socketsD)?it.socketsD:[];
  if(current.length>=socketsMax(it.slot))throw Error('Trang bị đã đủ ô khảm');
  const cost=15000*(current.length+1)*Math.max(1,(it.enhance||0)+1);
  charge(c,cost,{[gem]:1});
  it.socketsD=[...current,gem];sync(it);
  return {kind,success:true,cost,level:it.socketsD.length,name:it.name};
 }
 if(kind==='reforgeD'){
  if(!isGear||['wing','mount'].includes(it.slot)||!TYPES.includes(it.slot))throw Error('Chỉ nâng phẩm cấp trang bị thường tại đây; cánh và thú cưỡi có hệ thống riêng');
  const tier=it.economyTierD||0;
  if(tier>=3)throw Error('Đã đạt phẩm cấp tối đa 3');
  const cost=tierCost(it),gems=[{bless:2,chaos:1},{soul:3,chaos:2},{life:5,creation:2,chaos:3}][tier];
  charge(c,cost,gems);
  it.economyTierD=tier+1;sync(it);
  return {kind,success:true,cost,level:it.economyTierD,name:it.name};
 }
 if(kind==='trainD'){
  if(it.kind!=='pet'&&(!isGear||!['wing','mount'].includes(it.slot)))throw Error('Chỉ hỗ trợ pet, cánh và thú cưỡi');
  const rank=it.kind==='pet'?(it.trainingLevelD||0):(it.companionRankD||0);
  if(rank>=10)throw Error('Đã đạt cấp huấn luyện tối đa');
  const cost=(it.kind==='pet'?20000:it.slot==='wing'?100000:75000)*(rank+1)*(rank+1);
  const gems=it.kind==='pet'?{}:it.slot==='wing'?{soul:1}:{life:1};
  charge(c,cost,gems);
  if(it.kind==='pet'){
   it.trainingLevelD=rank+1;it.value=Math.max(0,Number(it.value)||0)+1;it.remainingMs=Math.min(24*3600000,Math.max(0,it.remainingMs||0)+2*3600000);it.hp=Number.isFinite(it.maxHp)?it.maxHp:100;
  }else{it.companionRankD=rank+1;sync(it)}
  return {kind,success:true,cost,level:rank+1,name:it.name};
 }
 if(kind==='feedD'){
  if(it.kind!=='pet')throw Error('Chỉ pet mới được chăm sóc');
  const max=Number.isFinite(it.maxHp)&&it.maxHp>0?it.maxHp:100;
  if((it.hp||0)>=max&&(it.remainingMs||0)>=30*60*1000)throw Error('Pet đã khỏe và đủ thời gian');
  const cost=10000;charge(c,cost);
  it.maxHp=max;it.hp=max;it.remainingMs=Math.min(4*3600000,Math.max(0,it.remainingMs||0)+30*60000);
  return {kind,success:true,cost,name:it.name};
 }
 throw Error('Tính năng không hợp lệ');
}
function install(D,PET){
 const original=PET.options;
 PET.options=function(c){
  const existing=original.call(this,c);
  const raven=c.gear?.shield?.pet==='raven'?c.gear.shield:null;
  return raven?.trainingLevelD&&c.petConfig?.enabled!==false?
    [...existing,{id:'flatDamage',name:'Quạ Tinh huấn luyện',value:raven.trainingLevelD*3}]:existing;
 };
}
module.exports={act,view,install,sync,socketsMax};