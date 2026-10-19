'use strict';
slotNames.pet='Pet';slotNames.mount='Thú cưỡi';
let inventorySelected=null;
const previewCanvas=p=>'<canvas class="characterPreview" width="384" height="384" data-preview="'+escape(p.id)+'" aria-label="Hình nhân vật đang mặc trang bị"></canvas>';
function bagIcon(it){return it?.icon?'<img src="assets/mu03/'+escape(it.icon)+'" alt="" loading="lazy">':'<span>◇</span>'}
function bindItemActions(){document.querySelectorAll('[data-fit]').forEach(b=>b.onclick=()=>openPoints(b.dataset.fit));for(const op of ['equip','sell','learn','enhance'])document.querySelectorAll('[data-'+op+']').forEach(b=>b.onclick=async()=>{if(op==='sell'&&!confirm('Bán món đồ này?'))return;b.disabled=true;const r=await action(op,{id:b.dataset[op]});if(b.isConnected)b.disabled=false;if(r?.enhanceResult)toast(r.enhanceResult.success?'Cường hóa thành công +'+r.enhanceResult.level:'Thất bại · Giữ nguyên cấp trang bị')});document.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{const r=await action('unequip',{slot:b.dataset.unequip});if(r)toast('Đã tháo trang bị về túi đồ');}finally{if(b.isConnected)b.disabled=false}});document.querySelectorAll('[data-dismount]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{const r=await action('ride',{enabled:false});if(r)toast('Đã xuống thú cưỡi');}finally{if(b.isConnected)b.disabled=false}});}

/* Visible set bonuses in the real inventory detail panel. */
function muSetDetail(it,c){
 if(!it||it.kind!=='gear'||it.rarity==='ancient'||it.ancient)return '';
 const jewel=['ring1','ring2','necklace'].includes(it.slot);
 const m=/^(?:7|8|9|10|11):(\d+)$/.exec(String(it.definitionId||''));
 if(!jewel&&!m)return '';
 const id=c.classId+(jewel?':accessory':':armor:'+m[1]);
 const equipped=Object.entries(c.gear||{}).filter(([slot,gear])=>{
  if(!gear||gear.kind!=='gear'||gear.rarity==='ancient'||gear.ancient)return false;
  if(jewel)return ['ring1','ring2','necklace'].includes(slot);
  return ['helm','armor','pant','glove','boot'].includes(slot)&&
   /^(?:7|8|9|10|11):(\d+)$/.exec(String(gear.definitionId||''))?.[1]===m[1];
 });
 const count=equipped.length,excellent=equipped.filter(([,g])=>g.rarity==='excellent').length,total=jewel?3:5;
 const group=state.stats?.excellentSets?.find(x=>x.id===id);
 const rules=jewel?[
  [2,'Hai trang sức: HP tối đa +3%',false],[3,'Đủ 3 món: Sát thương +3%',false],
  [2,'2 trang sức EX: Chí mạng +2%',true],[3,'3 trang sức EX: MP tối đa +4%',true]
 ]:[
  [2,'2 món: Phòng thủ +3%',false],[3,'3 món: HP tối đa +4%',false],
  [4,'4 món: Sát thương +3%',false],[5,'5 món: MP tối đa +5%',false],
  [2,'2 món EX: Chí mạng +2%',true],[3,'3 món EX: Giảm sát thương +3%',true],
  [5,'5 món EX: Sát thương +5%',true]
 ];
 const bonuses=group?.bonuses?.length?group.bonuses.map(b=>({
  name:b.name,need:b.need,ex:!!b.requiresExcellent,active:!!b.active
 })):rules.map(([need,name,ex])=>({need,name,ex,active:(ex?excellent:count)>=need}));
 const name=group?.name||(jewel?'Bộ trang sức':'Bộ '+String(it.name||'').replace(/^(?:Mũ|Áo|Quần|Găng|Giày)\s+/i,''));
 const activated=bonuses.filter(b=>b.active).length;
 const shortText=label=>{
  let text=String(label||'');
  if(text.includes(':'))text=text.slice(text.indexOf(':')+1).trim();
  return text.replace(/Tỷ lệ chí mạng/gi,'Chí mạng').replace(/Giảm sát thương nhận/gi,'Giảm ST nhận');
 };
 const section=(heading,kind,items)=>items.length?
  '<section class="muSetSection muSetSection-'+kind+'"><div class="muSetSectionHeading">'+heading+'</div>'
   +'<div class="muSetBonuses">'+items.map(b=>
    '<div class="muSetChip '+(b.active?'muSetActive':'muSetInactive')+'" title="'+escape(b.name)+'">'
     +'<strong>'+(b.active?'✦ ':'◇ ')+b.need+' món'+(b.ex?' EX':'')+'</strong>'
     +'<span>'+escape(shortText(b.name))+'</span></div>').join('')+'</div></section>':'';
 return '<details class="muSetDetails"><summary><span class="muSetTitle">✦ '+escape(name)+'</span>'
  +'<span class="muSetProgress">'+count+'/'+total+' · EX '+excellent+'/'+total+'</span>'
  +'<span class="muSetCount">'+activated+'/'+bonuses.length+'</span></summary>'
  +'<div class="muSetInner">'
  +section('Thuộc tính bộ','basic',bonuses.filter(b=>!b.ex))
  +section('Excellent','excellent',bonuses.filter(b=>b.ex))
  +'</div></details>';
}

renderInventory=function(){if(!state)return;const c=state.character,signature=JSON.stringify([c.gear,c.inventory,c.gems,c.materials,c.gold,c.attributes,c.level,c.riding,inventorySelected,state.stats?.excellentSets]);if(renderInventory.signature===signature)return;renderInventory.signature=signature;const all=[...Object.values(c.gear),...c.inventory].filter(i=>i.kind!=="socketSeed90"),selected=all.find(it=>it.id===inventorySelected)||all[0];inventorySelected=selected?.id;const slots=['helm','wing','weapon','armor','shield','glove','pant','boot','mount','ring1','ring2','necklace','pet'];$('#modalBody').innerHTML='<h2>Hành trang <small>LC '+state.stats.battlePower+'</small></h2><div class="inventoryLayout"><div class="paperdoll">'+previewCanvas(state.me)+'<div class="equipmentSlots">'+slots.map(slot=>{const it=c.gear[slot];return '<button class="equipSlot '+slot+' '+(it?.rarity==='excellent'?'excellent':it?.kind==='gear'&&it.rarity!=='ancient'?'normalGear':'')+'" '+(it?'data-item="'+escape(it.id)+'"':'disabled')+' title="'+escape(it?.name||slotNames[slot])+'">'+bagIcon(it)+'<small>'+(it&&['weapon','shield'].includes(slot)?(it.slot==='shield'?'Khiên':'Vũ khí')+' '+(it.hand==='both'?'(2 tay)':it.hand==='left'?'(T)':'(P)'):slotNames[slot])+'</small></button>'}).join('')+'</div></div><div class="bagPanel"><div class="bagGrid">'+Array.from({length:40},(_,i)=>{const it=c.inventory.filter(i=>i.kind!=='socketSeed90')[i];return '<button class="bagSlot '+(it?.id===inventorySelected?'selected ':'')+(it?.rarity==='excellent'?'excellent':it?.kind==='gear'&&it.rarity!=='ancient'?'normalGear':'')+'" '+(it?'data-item="'+escape(it.id)+'" aria-label="'+escape(it.name)+'"':'disabled aria-label="Ô trống"')+'>'+bagIcon(it)+(it?.enhance?'<small>+'+it.enhance+'</small>':'')+'</button>'}).join('')+'</div><p class="bagMoney">'+c.inventory.length+'/40 ô · '+c.gold.toLocaleString('vi-VN')+' Zen</p><div id="selectedItem">'+(selected?itemView(selected,Object.values(c.gear).some(it=>it.id===selected.id))+muSetDetail(selected,c):'Chọn một món đồ để xem chỉ số và thao tác.')+'</div></div></div><div class="gemBar">'+Object.entries(c.gems).map(([k,v])=>'<span>'+escape(({pink:'Ngọc Hồng',purple:'Ngọc Tím'})[k]||k)+' <b>'+v+'</b></span>').join('')+'</div><div class="inventoryToolbar"><button id="dictionary">Từ điển item</button><button id="openForge">Cánh & thú cưỡi</button><button id="economyDOpen">⚒ Khảm / Nâng</button><button id="bagPoints">Bảng điểm</button></div><p class="muted">Auto giữ lại cánh, thú cưỡi và đồ Excellent. Chọn đồ rồi Mặc / Nâng / Bán; trang bị +15 là tối đa.</p>';
// Remove redundant legacy metadata below the main card. Base defense remains in its summary.
const itemDetailRoot=document.querySelector('#selectedItem');
for(const line of [...(itemDetailRoot?.children||[])]){
 if(['P','SMALL'].includes(line.tagName)&&/^(?:Yêu cầu cấp|Nâng cấp|Phòng thủ cơ bản)\s*:/i.test(line.textContent.trim()))line.remove();
}
document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{inventorySelected=b.dataset.item;renderInventory.signature=null;renderInventory()});$('#dictionary').onclick=showDictionary;$('#openForge').onclick=openForge;$('#economyDOpen').onclick=()=>void openEconomyD();$('#bagPoints').onclick=()=>openPoints();bindItemActions();};
const oldOpenPoints=openPoints;
openPoints=function(itemId){oldOpenPoints(itemId);$('#modalBody').classList.add('pointsBody');const box=document.createElement('div');box.className='pointsPortrait';box.innerHTML=previewCanvas(state.me);$('#modalBody').insertBefore(box,$('#resourceStats'));};
const oldRenderRoster=showRoster;
showRoster=function(me){oldRenderRoster(me);$('#login').classList.add('selectionHall');document.querySelectorAll('[data-character]').forEach(b=>{const c=me.characters.find(c=>c.id===b.dataset.character);b.querySelector('img')?.remove();b.insertAdjacentHTML('afterbegin',previewCanvas(c));});};
const oldRenderClassDetail=renderClassDetail;
renderClassDetail=function(){oldRenderClassDetail();document.querySelectorAll('[data-class]').forEach(b=>{if(!b.querySelector('canvas')){b.querySelector('img')?.remove();b.insertAdjacentHTML('afterbegin',previewCanvas({id:'create-'+b.dataset.class}));}});$('#classDetail').insertAdjacentHTML('afterbegin',previewCanvas({id:'create-'+selectedClass}));};
function openForge(){if(!state)return;const c=state.character,names=state.crafting.materials;modal('<h2>Lò Chaos · Cánh & thú cưỡi</h2><p>Chiến Mã dành cho Chúa tể từ cấp 1. Cưỡi Fenrir từ cấp 300: tăng tốc di chuyển 20%; sói đen +10% sát thương, xanh +10% phòng thủ, hoàng kim có cả hai. Cánh cần đúng hệ và cấp nhân vật.</p><button id="rideToggle" '+(!c.gear.mount?'disabled':'')+'>'+(c.riding?'Xuống thú cưỡi':'Cưỡi thú đã mặc')+'</button><div class="gemBar">'+Object.entries(c.gems).map(([k,v])=>'<span>'+k+' <b>'+v+'</b></span>').join('')+'</div><details><summary>Nguyên liệu đang có</summary>'+Object.entries(names).map(([k,n])=>'<p>'+escape(n)+': '+(c.materials[k]||0)+'</p>').join('')+'</details><p class="muted">Ngọc và nguyên liệu rơi khi đánh quái. Công thức cánh và nâng màu sói được cân bằng cho bản web; tỉ lệ ba bước tạo sói đỏ theo ảnh bạn gửi. Thất bại vẫn tiêu hao toàn bộ nguyên liệu đã chọn.</p><div class="recipeList">'+state.crafting.recipes.map(r=>{const choices=r.consume?c.inventory.filter(it=>it.kind==='gear'&&it.slot===r.consume.slot&&(it.enhance||0)>=(r.consume.enhance||0)&&(!r.consume.tier||it.wingTier===r.consume.tier)&&(!r.consume.mount||it.mount===r.consume.mount)):[];return '<article class="recipe"><h3>'+escape(r.name)+' <span>'+r.rate+'%</span></h3><small>Cấp '+r.level+' · '+r.gold.toLocaleString('vi-VN')+' Zen</small><p>'+Object.entries(r.gems).map(([k,v])=>v+' '+k).concat(Object.entries(r.materials).map(([k,v])=>v+' '+names[k])).map(escape).join(' + ')+'</p>'+(r.consume?'<label>Tiêu hao '+(slotNames[r.consume.slot]||'trang bị')+(r.consume.tier?' cấp '+r.consume.tier:'')+' '+(r.consume.enhance?'+'+r.consume.enhance+' trở lên':'')+'<select id="material-'+r.id+'"><option value="">Chọn đồ trong túi</option>'+choices.map(it=>'<option value="'+it.id+'">'+escape(it.name)+' +'+(it.enhance||0)+'</option>').join('')+'</select></label>':'')+'<button class="gold" data-craft="'+r.id+'" '+(c.level<r.level?'disabled':'')+'>Chế tạo</button></article>'}).join('')+'</div><p id="forgeResult" role="status"></p>','forge');$('#rideToggle').onclick=async()=>{const r=await action('ride',{enabled:!state.character.riding});if(r)openForge()};document.querySelectorAll('[data-craft]').forEach(b=>b.onclick=async()=>{const recipe=b.dataset.craft,itemId=$('#material-'+recipe)?.value;if(!confirm('Chế tạo theo tỉ lệ đã hiển thị? Thất bại vẫn mất nguyên liệu.'))return;b.disabled=true;const r=await action('craft',{recipe,itemId});if(r){openForge();$('#forgeResult').textContent=(r.craftResult.success?'Thành công: ':'Thất bại: ')+r.craftResult.name;}else b.disabled=false;});}
const forgeButton=document.createElement('button');forgeButton.id='forge';forgeButton.textContent='✧ Cánh / Sói';forgeButton.onclick=openForge;document.querySelector('.leftcontrols').appendChild(forgeButton);
/* Package D: every cost and random outcome is checked by the game server. */
let economySelectedD=null;
async function openEconomyD(){
 if(!state)return;
 let model;try{model=await api('economyD');}catch(e){toast(e.message);return;}
 const items=model.items||[],gold=state.character.gold,gems=state.character.gems||{};
 if(!items.some(it=>it.id===economySelectedD))economySelectedD=items[0]?.id||null;
 const fmt=n=>(Number(n)||0).toLocaleString('vi-VN');
 const gemNames={bless:'Bless',soul:'Soul',chaos:'Chaos',life:'Life',creation:'Creation'};
 const choose='<label class="ecoLabel">Chọn vật phẩm trong hành trang / đang mặc<select id="ecoItemD">'
  +items.map(it=>'<option value="'+escape(it.id)+'" '+(it.id===economySelectedD?'selected':'')+'>'
   +escape(it.name)+' · '+escape(it.slot)+(it.enhance?' +'+it.enhance:'')+'</option>').join('')+'</select></label>';
 const selected=items.find(it=>it.id===economySelectedD),can=selected&&!selected.locked;
 const gemList=selected?.allowedGems?.length?selected.allowedGems:[],
  choices='<label class="ecoLabel">Ngọc để khảm<select id="ecoGemD">'+gemList.map(k=>'<option value="'+k+'">'+gemNames[k]+' ('+(gems[k]||0)+')</option>').join('')+'</select></label>';
 const button=(kind,title,details,enabled=true)=>'<button type="button" class="ecoActionD" data-economy-d="'+kind+'" '+(!enabled?'disabled':'')+'>'
   +'<strong>'+title+'</strong><small>'+details+'</small></button>';
 const affordable=cost=>gold>=cost;
 const socket=selected?.kind==='gear'&&gemList.length&&selected.sockets.length<selected.maxSockets;
 const reforge=selected?.kind==='gear'&&!['wing','mount'].includes(selected.slot)&&selected.tier<3;
 const train=selected?.kind==='pet'||selected?.kind==='gear'&&['wing','mount'].includes(selected.slot);
 const rankCost=selected?.trainCost||0;
 const feed=selected?.kind==='pet';
 const summary=selected?'<p class="ecoDetailD"><strong>'+escape(selected.name)+'</strong> · Cấp nâng +'+selected.enhance
  +' · Phẩm '+selected.tier+'/3 · Huấn luyện '+selected.rank+'/10 · Khảm '+selected.sockets.length+'/'+selected.maxSockets
  +(selected.sockets.length?' ('+selected.sockets.map(k=>gemNames[k]||k).join(', ')+')':'')+'</p>':'<p>Không có vật phẩm.</p>';
 modal('<h2>⚒ Trang bị & Kinh tế</h2><p>Zen: <strong>'+fmt(gold)+'</strong> · '+Object.entries(gemNames).map(([k,v])=>v+' '+(gems[k]||0)).join(' · ')+'</p>'
  +'<p class="muted">Cường hóa +1 → +15 trong Hành trang. Cánh và thú cưỡi vẫn chế tạo ở Lò Chaos. Mọi khoản chi được máy chủ xác nhận và lưu trên Neon.</p>'
  +'<div class="ecoPanelD">'+choose+summary+choices
  +'<div class="ecoGridD">'
  +button('socketD','💎 Khảm ngọc',''+fmt(selected?.socketCost||0)+' Zen · 1 viên ngọc',can&&socket&&affordable(selected.socketCost))
  +button('reforgeD','⚒ Nâng phẩm cấp',''+fmt(selected?.reforgeCost||0)+' Zen · '+Object.entries(selected?.reforgeGems||{}).map(([k,n])=>n+' '+gemNames[k]).join(' + ')+' · Giữ nguyên ngoại hình',can&&reforge&&affordable(selected.reforgeCost))
  +button('trainD','✦ Huấn luyện pet / cánh / thú',''+fmt(rankCost)+' Zen '+(selected?.kind==='pet'?'':selected?.slot==='wing'?'+ 1 Soul':'+ 1 Life'),can&&train&&selected.rank<10&&affordable(rankCost))
  +button('feedD','♡ Chăm sóc pet','10.000 Zen · Phục hồi HP + thời gian sử dụng',can&&feed&&affordable(10000))
  +'</div></div>'
  +'<div class="ecoPanelD"><h3>Chế tạo ngọc</h3><p>5 Bless + 5 Soul + 1 Chaos + 100.000 Zen → 1 Life</p>'
  +button('jewelFusion','◆ Dung luyện Life','Thành công 100% · Không có tỷ lệ ngẫu nhiên',affordable(100000)&&gems.bless>=5&&gems.soul>=5&&gems.chaos>=1)
  +'<p class="muted">Nâng phẩm tối đa 3, khảm theo loại trang bị và huấn luyện tối đa 10. Mỗi lần đều tiêu hao Zen để cân bằng kinh tế.</p></div>','economyD');
 const chooser=$('#ecoItemD');
 if(chooser)chooser.onchange=()=>{economySelectedD=chooser.value;void openEconomyD()};
 document.querySelectorAll('[data-economy-d]').forEach(button=>{
  button.onclick=async()=>{
   if(button.disabled)return;
   const kind=button.dataset.economyD;
   const id=$('#ecoItemD')?.value,gem=$('#ecoGemD')?.value;
   const label=button.querySelector('strong')?.textContent||'Thao tác';
   if(!confirm(label+'? Ngọc và Zen đã dùng không được hoàn trả.'))return;
   button.disabled=true;
   const response=await action('economyDAct',{kind,id,gem});
   if(response?.economyResult){
    const result=response.economyResult;
    await openEconomyD();
    toast('✓ '+escape(result.name||'Thành công')+(result.level?' · Cấp '+result.level:'')+' · -'+fmt(result.cost)+' Zen');
   }else if(button.isConnected)button.disabled=false;
  };
 });
}

let previewAt=0;
function framePreviews(time){if(time-previewAt<1/15)return;previewAt=time;const canvases=[...document.querySelectorAll('.characterPreview')].filter(el=>el.getBoundingClientRect().height>0);if(!canvases.length)return;const actors=canvases.map(el=>{const id=el.dataset.preview,c=window.MU_CRAFT_PREVIEWS120?.get(id)||(state?.me.id===id?state.me:rosterData?.characters?.find(c=>c.id===id)||{id,classId:id.startsWith('create-')?id.slice(7):selectedClass,gear:{}});return liveVisualPlayer({...c,hp:1,maxHp:1,action:'idle',facing:Math.PI*3/4});});prepareLiveActors(actors,time);canvases.forEach((el,i)=>{const ct=el.getContext('2d'),p=actors[i];ct.clearRect(0,0,384,384);const grd=ct.createRadialGradient(192,260,5,192,230,160);grd.addColorStop(0,'#b68a3333');grd.addColorStop(1,'#0000');ct.fillStyle=grd;ct.fillRect(0,0,384,384);if(!drawLivePlayer(p,192,p.id==='craft-preview120'?318:360,ct,p.id==='craft-preview120'?340:(p.gear?.wing||p.riding)?440:640)){const im=MU_ART.images['portrait-'+p.classId];if(im)ct.drawImage(im,60,50,264,264);}});}
