'use strict';
// Ordinary and Excellent equipment sets: separate from Ancient (Thần) rules.
// MU armor indices 7:..11:.. are a single named equipment family.
// Jewelry has one per-class accessory family (two rings + necklace).
const ARMOR=new Set(['helm','armor','pant','glove','boot']);
const JEWELS=new Set(['ring1','ring2','necklace']);
const RULES=[
 {need:2,name:'Đồng bộ 2 món: Phòng thủ +3%',id:'defense',value:3},
 {need:3,name:'Đồng bộ 3 món: HP tối đa +4%',id:'health',value:4},
 {need:4,name:'Đồng bộ 4 món: Sát thương +3%',id:'damage',value:3},
 {need:5,name:'Đủ 5 món: MP tối đa +5%',id:'mana',value:5}
];
const EXTRAS=[
 {need:2,name:'2 món Excellent: Tỷ lệ chí mạng +2%',id:'critical',value:2},
 {need:3,name:'3 món Excellent: Giảm sát thương nhận +3%',id:'reduction',value:3},
 {need:5,name:'Đủ 5 món Excellent: Sát thương +5%',id:'damage',value:5}
];
const ACCESSORY=[
 {need:2,name:'Hai trang sức: HP tối đa +3%',id:'health',value:3},
 {need:3,name:'Đủ nhẫn và dây chuyền: Sát thương +3%',id:'damage',value:3}
];
const ACCESSORY_EX=[
 {need:2,name:'Hai trang sức Excellent: Chí mạng +2%',id:'critical',value:2},
 {need:3,name:'Bộ trang sức Excellent: MP tối đa +4%',id:'mana',value:4}
];
function family(item,c){
 if(!item||item.kind!=='gear'||item.rarity==='ancient'||item.ancient||item.disabled||item.retired||item.expiresAt&&item.expiresAt<=Date.now())return null;
 if(!ARMOR.has(item.slot)&&!JEWELS.has(item.slot))return null;
 if(JEWELS.has(item.slot))return c.classId+':accessory';
 const id=String(item.definitionId||''),parts=/^(7|8|9|10|11):(\d+)$/.exec(id);
 if(!parts)return null;
 return c.classId+':armor:'+parts[2];
}
function view(c){
 const map=new Map(),gear=c.gear||{};
 for(const [slot,it] of Object.entries(gear)){
  if(!it||it.slot!==slot)continue;
  const key=family(it,c);if(!key)continue;
  if(!map.has(key))map.set(key,{id:key,name:key.endsWith(':accessory')?'Bộ trang sức '+c.classId:'Bộ '+String(it.name||'').replace(/^(?:Mũ|Áo|Quần|Găng|Giày)\s+/i,'') ,pieces:key.endsWith(':accessory')?3:5,slots:[],excellent:0});
  const x=map.get(key);
  if(!x.slots.includes(slot)){x.slots.push(slot);if(it.rarity==='excellent')x.excellent++;}
 }
 return [...map.values()].map(x=>({...x,count:x.slots.length,bonuses:(x.pieces===3?[...ACCESSORY,...ACCESSORY_EX.map(b=>({...b,requiresExcellent:true}))]:[...RULES,...EXTRAS.map(b=>({...b,requiresExcellent:true}))]).map(b=>({...b,active:(b.requiresExcellent?x.excellent:x.count)>=b.need}))}));
}
function options(c){return view(c).flatMap(group=>group.bonuses.filter(b=>b.active).map(b=>({id:b.id,value:b.value})))}
module.exports={family,view,options};
