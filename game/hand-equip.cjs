'use strict';
// Dual-wield equipment with one canonical primary weapon and one secondary
// weapon / shield slot. "hand" describes the physical hand, not the item type.
const E=require('./equipment-config.cjs');
const P=require('./progression.cjs');
const R=require('./combat-rules.cjs');
const ELITE=require('./elite-options.cjs');
const LABEL={strength:'Sức mạnh',dexterity:'Nhanh nhẹn',vitality:'Thể lực',energy:'Năng lượng',leadership:'Mệnh lệnh'};
const TWO_HAND=['bow','crossbow'];
const AMMO=new Set(['4:7','4:15']);
const weapon=it=>it?.kind==='gear'&&(it.slot==='weapon'||it.slot==='shield');
function twoHands(it){return it?.slot==='weapon'&&(TWO_HAND.includes(R.rule(it)?.type)||Boolean(R.rule(it)?.bothHands));}
function reasons(c,it){
 const fail=[];
 if(!it||it.kind!=='gear')return ['Đây không phải trang bị'];
 if(!E.rule(it)&&it.definitionId)fail.push('Không tìm thấy cấu hình món đồ trong Item.txt');
 if(AMMO.has(it.definitionId))fail.push('Đây là đạn/tên, không phải cung hoặc nỏ');
 if(it.classes?.length&&!it.classes.includes(c.classId))fail.push('Sai hệ: trang bị dành cho '+it.classes.join(', '));
 if(it.classId&&!(it.classes||[]).length&&it.classId!==c.classId)fail.push('Sai hệ nhân vật');
 const stage=E.rule(it)?.classStages?.[c.classId]||it.classStages?.[c.classId]||1;
 if((c.classStage||1)<stage)fail.push('Cần chuyển chức cấp '+stage+' (hiện tại '+(c.classStage||1)+')');
 if(c.classId==='gladiator'&&it.slot==='helm')fail.push('Magic Gladiator không đội được mũ theo quy tắc hệ');
 if((c.level||1)<(it.requiredLevel||0))fail.push('Thiếu cấp nhân vật: cần '+it.requiredLevel+', hiện '+c.level);
 const req=it.requirements||{};
 for(const [key,title] of Object.entries(LABEL)){
  const need=Number(req[key])||0,have=Number(c.attributes?.[key])||0;
  if(need>have)fail.push('Thiếu '+title+': cần '+need+', hiện '+have+' (thiếu '+(need-have)+')');
 }
 if(weapon(it)&&!R.weaponAllowed(c,it)&&!AMMO.has(it.definitionId))fail.push('Loại vũ khí/khiên này không được phép cho hệ nhân vật');
 return [...new Set(fail)];
}
function installed(c){
 const items=[];
 for(const key of ['weapon','shield'])if(c.gear?.[key]){
  const it=c.gear[key];
  items.push({key,it,hand:it.hand==='left'||it.hand==='right'?it.hand:key==='weapon'?'right':'left'});
 }
 return items;
}
function synchronize(c){
 c.equipment=c.gear?.weapon?.slot==='weapon'?c.gear.weapon:c.gear?.shield?.slot==='weapon'?c.gear.shield:null;
}
function equipHand(c,id,target=''){
 const i=c.inventory?.findIndex(it=>it.id===id)??-1;
 if(i<0)throw Error('Không có món đồ trong hành trang');
 const item=c.inventory[i];if(!weapon(item))return null;
 E.sync(item);
 const faults=reasons(c,item);if(faults.length)throw Error('Không thể trang bị: '+faults.join(' · '));
 const bow=twoHands(item);
 if(!['','left','right','both'].includes(target))throw Error('Tay trang bị không hợp lệ');
 if(bow&&target&&target!=='both')throw Error('Cung và nỏ bắt buộc dùng cả hai tay');
 if(!bow&&target==='both')throw Error('Trang bị này phải chọn tay trái hoặc tay phải');
 const hand=bow?'both':target||(item.slot==='shield'?'left':'right');
 const standing=installed(c);
 const remain=[],displaced=[];
 for(const slot of standing){
  if(bow||twoHands(slot.it)||slot.hand===hand||item.slot==='shield'&&slot.it.slot==='shield')displaced.push(slot.it);
  else remain.push(slot.it);
 }
 const carried=remain.concat(item);
 if(carried.filter(it=>it.slot==='weapon').length>2||carried.filter(it=>it.slot==='shield').length>1||carried.length>2)throw Error('Hai tay đã có trang bị không tương thích');
 if(c.inventory.length-1+displaced.length>40)throw Error('Túi đã đầy, cần chỗ cho trang bị thay ra');
 c.inventory.splice(i,1);
 c.inventory.push(...displaced);
 item.hand=hand;
 delete c.gear.weapon;delete c.gear.shield;
 const weapons=carried.filter(it=>it.slot==='weapon'),shield=carried.find(it=>it.slot==='shield');
 if(weapons.length)c.gear.weapon=weapons[0];
 if(weapons.length>1)c.gear.shield=weapons[1];
 else if(shield)c.gear.shield=shield;
 synchronize(c);
 ELITE.updateCharacter(c);
 return item;
}
function switchHand(c,id,target){
 if(!['left','right'].includes(target))throw Error('Chỉ chọn tay trái hoặc tay phải');
 const slots=installed(c),mine=slots.find(s=>s.it.id===id);
 if(!mine)throw Error('Không tìm thấy trang bị đang mặc');
 if(twoHands(mine.it))throw Error('Cung và nỏ luôn sử dụng hai tay');
 if(mine.hand===target)return mine.it;
 const other=slots.find(s=>s!==mine&&s.hand===target);
 if(other){other.it.hand=mine.hand;}
 mine.it.hand=target;
 synchronize(c);
 return mine.it;
}
function install(D){
 if(D.handEquipmentInstalled)return;
 D.handEquipmentInstalled=true;
 const prior=D.equip;
 D.equip=function(c,id,hand){
  const it=c.inventory?.find(x=>x.id===id);
  if(!it)throw Error('Không có món đồ trong hành trang');
  if(!weapon(it)){
   E.sync(it);
   const faults=reasons(c,it);
   if(faults.length)throw Error('Không thể trang bị: '+faults.join(' · '));
   return prior(c,id,hand);
  }
  return equipHand(c,id,hand);
 };
 D.equipCheck=reasons;
 D.switchHand=switchHand;
}
module.exports={install,reasons,equipHand,switchHand,twoHands,synchronize};
