'use strict';
/* Elf skill summons. The pet is an ally in server snapshots, not an inventory item. */
(()=>{
 const list=document.querySelector('#skillList');
 if(!list)return;
 function paint(){
  if(typeof state==='undefined'||!state||state.character?.classId!=='elf')return;
  const body=document.querySelector('#modalBody');
  if(!body||!body.querySelector('[data-skill]'))return;
  if(body.querySelector('#elfSummonPanel'))return;
  const wrap=document.createElement('section');
  wrap.id='elfSummonPanel';
  wrap.style.cssText='margin:12px 0;padding:12px;border:1px solid #68896a;background:#111a17;color:#d3efcb';
  const title=document.createElement('h3');title.textContent='🌿 Triệu hồi đồng hành (Elf)';wrap.appendChild(title);
  const caption=document.createElement('p');caption.textContent='Pet triệu hồi chiến đấu độc lập với thú trang bị. Chỉ dùng một pet triệu hồi tại một thời điểm.';wrap.appendChild(caption);
  const owned=state.elfSummons?.find(p=>p.ownerId===state.character.id);
  if(owned){const info=document.createElement('p');info.textContent='Đang triệu hồi: '+owned.name;wrap.appendChild(info)}
  for(const skill of state.elfSummonSkills||[]){
   const button=document.createElement('button');
   button.type='button';button.textContent=skill.name+' · '+skill.mana+' MP'+(!skill.hasModel?' (thiếu mô hình)':'');
   button.disabled=!skill.hasModel;
   button.style.cssText='margin:3px;padding:7px 10px;min-height:36px';
   button.onclick=async()=>{
    button.disabled=true;
    try{const result=await action('elfSummon',{skillId:skill.id});if(result)toast('Đã triệu hồi '+skill.name);}
    catch(error){toast(error.message||'Triệu hồi thất bại')}
    finally{button.disabled=false;}
    document.querySelector('#close')?.click();
   };
   wrap.appendChild(button);
  }
  body.appendChild(wrap);
 }
 list.addEventListener('click',()=>setTimeout(paint,0));
})();
