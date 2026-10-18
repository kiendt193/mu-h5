'use strict';
(function(){
 const css=document.createElement('link');css.rel='stylesheet';css.href='pc-visual.css?v=8';document.head.appendChild(css);
 function visibility(){const login=document.querySelector('#login');document.body.classList.toggle('muLogin71',!state||!login?.hidden);}
 visibility();const loginObserver=document.querySelector('#login');if(loginObserver)new MutationObserver(visibility).observe(loginObserver,{attributes:true,attributeFilter:['hidden']});
 const weaponNames={sword:'Kiếm',axe:'Rìu',mace:'Chùy',spear:'Thương',staff:'Gậy / Trượng',bow:'Cung',crossbow:'Nỏ',scepter:'Quyền trượng',fist:'Quyền'};
 const icons={ 'Từ điển item':'▤','Reset nhân vật':'↻','Pet hỗ trợ':'♧','Muun hỗ trợ':'♧','Kho riêng':'▣','Sự kiện / Phụ bản':'⚑','Hình ảnh / Ẩn cánh, thú cưỡi':'☼' };
 let serverOffset=0,readyAt=0,cooldownLength=1,lastFx='',actorId=null,search='',learnedOnly=false,previewFrame=0;
 function playClock(){return Date.now()-serverOffset;}
 function gate(sk){return MU_PC_RULES.gate(state,sk);}
 function fallbackImage(im,id){let step=0;im.onerror=()=>{if(step++===0)im.src='assets/skill-icons/'+id+'.svg';else{im.onerror=null;im.removeAttribute('src');im.style.display='none';}};}
 function hotbar(){
  if(!state)return;const slots=document.querySelectorAll('[data-hotbar-slot]'),ids=state.character.hotbar?.skills||[state.character.activeSkill];
  for(const b of slots){const index=Number(b.dataset.hotbarSlot),sk=state.skills.find(s=>s.id===ids[index]);b.classList.toggle('pcSelected',!!sk&&state.character.activeSkill===sk.id);b.classList.toggle('pcUnavailable',!!sk&&(gate(sk).length>0||state.me.mp<sk.mana));
   const im=b.querySelector('img');if(im&&!im.dataset.pcIcon){im.dataset.pcIcon='1';fallbackImage(im,sk?.id||'fire');}
   b.title=sk?sk.name+' · '+sk.mana+' MP · '+sk.cooldown/1000+' giây'+(gate(sk).length?' · '+gate(sk).join(', '):''):'Ô '+(index+1)+' · Gán trong Cài đặt Auto';
   let shade=b.querySelector('.pcCooldown'),number=b.querySelector('.pcCooldownNumber');if(!shade){shade=document.createElement('span');shade.className='pcCooldown';number=document.createElement('span');number.className='pcCooldownNumber';b.append(shade,number);}
   const cd=MU_PC_RULES.cooldown(readyAt-cooldownLength,cooldownLength,playClock());shade.hidden=number.hidden=!sk||cd.ms<=0;shade.style.setProperty('--pc-cd-cut',cd.cut+'%');number.textContent=cd.text;
  }
  const controls=document.querySelector('.controls71');if(controls&&document.querySelector('#auto'))document.querySelector('#auto').setAttribute('aria-pressed',String(!!state.auto));
  document.querySelectorAll('#identity .sd71').forEach(el=>el.remove());
 }
 function panel(){
  if(!state)return;cancelAnimationFrame(previewFrame);
  const list=state.skills.filter(sk=>(!learnedOnly||state.character.skills.includes(sk.id))&&(!search||sk.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))));
  modal('<h2>Kỹ năng · '+escape(state.classes?.[state.me.classId]?.name||state.me.name)+'</h2><p>Học sách / ngọc trong Hành trang. Gán 4 ô và kỹ năng hỗ trợ tại Cài đặt Auto.</p><div class="pcSkillSearch"><input id="pcSkillSearch" placeholder="Tìm kỹ năng" value="'+escape(search)+'"><button id="pcLearnedOnly">'+(learnedOnly?'Tất cả kỹ năng':'Chỉ đã học')+'</button></div><div class="pcSkills">'+list.map(sk=>{const reasons=gate(sk),active=state.character.activeSkill===sk.id;return '<article class="pcSkillCard '+(active?'active':'')+'" data-pc-card="'+escape(sk.id)+'"><img src="assets/skill-icons/'+escape(sk.id)+'.png" alt="'+escape(sk.name)+'"><div><h3>'+escape(sk.name)+'</h3><p>'+escape(sk.description||'')+'</p><div class="pcSkillMeta"><span>Cấp '+sk.level+'</span><span>'+sk.mana+' MP</span><span>Hồi '+(sk.cooldown/1000).toLocaleString('vi-VN')+' giây</span><span>'+(sk.area?'Vùng '+Math.round(sk.area):'Tầm '+Math.round(sk.range||0))+'</span><span>Chuyển chức '+Math.max(0,(sk.requiredStage||1)-1)+' lần</span></div><p class="pcGate '+(!reasons.length?'ready':'')+'">'+escape(reasons.join(' · ')||'Đã học · Đủ điều kiện sử dụng')+'</p><div class="pcSkillActions"><button data-pc-select="'+escape(sk.id)+'" '+(reasons.length?'disabled':'')+'>'+(active?'Đang chọn':'Chọn kỹ năng')+'</button><button data-pc-preview="'+escape(sk.id)+'">Xem hiệu ứng</button></div></div></article>';}).join('')+'</div>'+(!list.length?'<p class="pcSkillEmpty">Không có kỹ năng phù hợp bộ lọc.</p>':'')+'<p><button id="pcBindSkills">Cài đặt Auto / Gán kỹ năng</button></p>','skills');
  // The PC/mobile skill window is rendered here, overriding the legacy skillList.
  // Put Elf summons in the actual panel, not in a stale click handler.
  if(state.character.classId==='elf'){
   const root=document.querySelector('#modalBody');
   if(root){
    const box=document.createElement('section');box.className='pcElfSummons';box.id='elfSummonPanel';
    box.style.cssText='margin:14px 0;padding:14px;border:1px solid #6f9274;background:#101b18';
    const current=(state.elfSummons||[]).find(x=>x.ownerId===state.character.id);
    const heading=document.createElement('h3');heading.textContent='🌿 Triệu hồi đồng hành · Elf';box.appendChild(heading);
    const desc=document.createElement('p');desc.textContent=current?'Đồng hành hiện tại: '+current.name:'Gọi một quái đồng hành đi theo và tự động hỗ trợ đánh quái.';box.appendChild(desc);
    const summonList=(state.elfSummonSkills||[]).filter(sk=>!search||sk.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))||sk.english.toLowerCase().includes(search.toLowerCase()));
    for(const sk of summonList){
     const button=document.createElement('button');button.type='button';
     button.textContent=sk.name+' · '+sk.mana+' MP'+(sk.hasModel?'':' · Chưa có model');
     button.disabled=!sk.hasModel;button.style.cssText='margin:4px;padding:9px 12px;min-height:42px';
     button.onclick=async()=>{button.disabled=true;try{const r=await action('elfSummon',{skillId:sk.id});if(r){toast('Đã triệu hồi '+sk.name);panel();}}catch(error){toast(error.message||'Không triệu hồi được');}finally{if(button.isConnected)button.disabled=!sk.hasModel;}};
     box.appendChild(button);
    }
    if(!summonList.length){const empty=document.createElement('p');empty.textContent='Không tìm thấy kỹ năng triệu hồi khớp bộ lọc.';box.appendChild(empty)}
    root.querySelector('.pcSkills')?.before(box);
   }
  }
  for(const im of document.querySelectorAll('.pcSkillCard>img'))fallbackImage(im,im.closest('[data-pc-card]').dataset.pcCard);
  document.querySelector('#pcLearnedOnly').onclick=()=>{learnedOnly=!learnedOnly;panel();};
  const input=document.querySelector('#pcSkillSearch');input.oninput=()=>{search=input.value;panel();const next=document.querySelector('#pcSkillSearch');next.focus();next.setSelectionRange(search.length,search.length);};
  for(const b of document.querySelectorAll('[data-pc-select]'))b.onclick=async()=>{b.disabled=true;try{if(await action('selectSkill',{id:b.dataset.pcSelect}))panel();}finally{if(b.isConnected)b.disabled=false;}};
  for(const b of document.querySelectorAll('[data-pc-preview]'))b.onclick=()=>preview(b.dataset.pcPreview);
  document.querySelector('#pcBindSkills').onclick=()=>document.querySelector('#autoSettings').click();
 }
 function preview(id){
  cancelAnimationFrame(previewFrame);document.querySelectorAll('.pcPreview').forEach(c=>c.remove());
  const sk=state.skills.find(s=>s.id===id),card=Array.from(document.querySelectorAll('[data-pc-card]')).find(x=>x.dataset.pcCard===id);if(!sk||!card)return;
  const canvas=document.createElement('canvas');canvas.className='pcPreview';canvas.width=480;canvas.height=130;card.querySelector('div').appendChild(canvas);const c=canvas.getContext('2d');if(!c)return;
  const start=performance.now();function frame(now){if(!canvas.isConnected||modalMode!=='skills')return;const t=((now-start)/1000)%1.7;c.clearRect(0,0,480,130);c.fillStyle='#b9c9d0';c.fillRect(93,56,13,37);c.fillStyle='#7c969f';c.fillRect(341,56,13,37);const e={skill:true,skillId:id,effect:sk.effect,classId:state.me.classId,x:350,y:95,fromX:100,fromY:95,radius:sk.area,t:t/1.7*(MU_PC_PROFILES[id]?.duration||1)};MU_FX.draw(c,[e],0,(x,y)=>({x,y}));previewFrame=requestAnimationFrame(frame);}previewFrame=requestAnimationFrame(frame);
 }
 const before=apply;apply=function(r){before(r);visibility();if(!r.me)return;serverOffset=Date.now()-r.now;if(actorId!==r.me.id){actorId=r.me.id;lastFx='';readyAt=0;}const fx=r.me.skillFx;if(fx&&fx.id!==lastFx){lastFx=fx.id;const sk=r.skills.find(s=>s.id===fx.skillId);if(sk){readyAt=fx.at+sk.cooldown;cooldownLength=Math.max(1,sk.cooldown);}}hotbar();};
 document.querySelector('#skillList').onclick=()=>{search='';learnedOnly=false;panel();};
 const other=document.querySelector('#otherTab').onclick;document.querySelector('#otherTab').onclick=function(e){other?.call(this,e);for(const b of document.querySelectorAll('.otherGrid button')){if(b.querySelector('span'))continue;const label=(typeof MU_I18N==='undefined'?b.textContent:MU_I18N.sourceText(b)).trim(),icon=icons[label]||'✧',s=document.createElement('span');s.textContent=icon;b.prepend(s);}};
 setInterval(()=>{const login=document.querySelector('#login');if(state&&login?.hidden)hotbar();},100);
 document.addEventListener('keydown',e=>{if(!state||!document.querySelector('#login')?.hidden||e.repeat||e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName))return;const key=e.key.toLowerCase();const map={c:'characterTab',v:'inventory',s:'skillList'};const id=map[key];if(id){document.querySelector('#'+id)?.click();e.preventDefault();}});
})();
