'use strict';
/* Equipment hints and hand controls. Server validates every request. */
(function(){
 const LABEL={strength:'Sức mạnh',dexterity:'Nhanh nhẹn',energy:'Năng lượng',vitality:'Thể lực',leadership:'Mệnh lệnh'};
 const CLASSES={knight:'Chiến binh',wizard:'Pháp sư',elf:'Tiên nữ',gladiator:'Đấu sĩ',darklord:'Chúa tể',summoner:'Thuật sĩ',fighter:'Thiết binh'};
 const handItem=it=>it?.kind==='gear'&&['weapon','shield'].includes(it.slot);
 const bow=it=>it?.slot==='weapon'&&(['bow','crossbow'].includes(it.weaponType)||/^4:/.test(it.definitionId||'')&&!['4:7','4:15'].includes(it.definitionId));
 function reasons(it){
  const c=state?.character;if(!c||it?.kind!=='gear')return [];
  const errors=[];
  if(['4:7','4:15'].includes(it.definitionId))errors.push('Đây là tên/đạn, không phải cung hoặc nỏ');
  if(it.classes?.length&&!it.classes.includes(c.classId))errors.push('Sai hệ: '+it.classes.map(k=>CLASSES[k]||k).join(', '));
  if(it.classId&&!it.classes?.length&&it.classId!==c.classId)errors.push('Không dùng được cho hệ này');
  const stage=it.classStages?.[c.classId]||1;
  if((c.classStage||1)<stage)errors.push('Chưa chuyển chức: yêu cầu bậc '+stage+', hiện bậc '+(c.classStage||1));
  if(c.classId==='gladiator'&&it.slot==='helm')errors.push('Đấu sĩ MG không được đội mũ');
  if((c.level||1)<(it.requiredLevel||0))errors.push('Thiếu cấp: yêu cầu '+it.requiredLevel+', hiện '+c.level);
  for(const [key,label]of Object.entries(LABEL)){
   const required=Number(it.requirements?.[key])||0,actual=Number(c.attributes?.[key])||0;
   if(required>actual)errors.push('Thiếu '+label+': '+(required-actual)+' điểm ('+actual+'/'+required+')');
  }
  return errors;
 }
 const prev=itemView;
 itemView=function(it,equipped=false){
  let html=prev(it,equipped);
  if(it?.kind!=='gear')return html;
  const faults=reasons(it);
  let append='';
  if(!equipped&&faults.length)append+='<p class="muEquipWarning">Chưa thể đeo: '+faults.map(escape).join(' · ')+'</p>';
  if(handItem(it)){
   if(!equipped){
    const buttons=bow(it)?'<button data-hand-equip="'+escape(it.id)+'" data-hand="both">🏹 Đeo cung/nỏ (hai tay)</button>':
     '<button data-hand-equip="'+escape(it.id)+'" data-hand="left">Đeo tay trái</button><button data-hand-equip="'+escape(it.id)+'" data-hand="right">Đeo tay phải</button>';
    html=html.replace('<button data-equip="'+it.id+'">Mặc</button>',buttons);
   }else if(!bow(it)){
    const current=it.hand||(state.character.gear.weapon?.id===it.id?'right':'left');
    append+='<span class="muHandLabel">Đang cầm tay '+(current==='right'?'phải':'trái')+'</span><button data-hand-switch="'+escape(it.id)+'" data-hand="'+(current==='right'?'left':'right')+'">Chuyển sang tay '+(current==='right'?'trái':'phải')+'</button>';
   }else append+='<span class="muHandLabel">Đang dùng cả hai tay</span>';
  }
  return append?html.replace(/<\/div>$/,append+'</div>'):html;
 };
 document.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-hand-equip],button[data-hand-switch]');
  if(!button)return;
  event.preventDefault();event.stopPropagation();
  if(button.disabled)return;
  button.disabled=true;
  const id=button.dataset.handEquip||button.dataset.handSwitch,hand=button.dataset.hand;
  const result=await action(button.dataset.handSwitch?'handSwitch':'equip',{id,hand});
  if(result){toast('Đã cập nhật tay cầm');if(modalMode==='inventory'){renderInventory.signature=null;renderInventory();}}
  if(button.isConnected)button.disabled=false;
 },true);
})();
