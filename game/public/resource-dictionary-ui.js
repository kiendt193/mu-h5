'use strict';
/* MU H5 consolidated Resource Guide: actual material sources and potential
 * drop areas for the current source-items catalog. No fictional drop table. */
(()=>{
 let definitions=null,sources=null,loadAt=0,serial=0;
 let tab='materials',query='',selected='',page=0,requesting=false;
 const escapeText=v=>escape(String(v??''));
 const fmt=v=>Number(v||0).toLocaleString('vi-VN');
 const materials=()=>({
  ...state.crafting.materials,bless:'Ngọc Bless',soul:'Ngọc Soul',
  chaos:'Ngọc Chaos',life:'Ngọc Life',creation:'Ngọc Creation',
  pink:'Ngọc Hồng',purple:'Ngọc Tím'
 });
 const getCount=id=>state.character.gems?.[id]??state.character.materials?.[id]??0;
 const sourceMap=()=>new Map((sources||[]).map(v=>[Number(v.id),Array.isArray(v.levels)?v.levels:[]]));
 const areas=(level=1)=>{
  const by=sourceMap();
  return (state.maps||[]).map((m,id)=>({...m,id})).filter(m=>m.available!==false&&!m.farm&&!m.pk100&&!m.instance&&by.get(m.id)?.some(n=>n+10>=level))
  .sort((a,b)=>(a.level||0)-(b.level||0));
 };
 const mapList=(maps,label)=>maps.length?
  '<details class="muResourceAreas" open><summary>'+escapeText(label)+' · '+maps.length+' bản đồ</summary><div class="muResourceMapList">'
  +maps.map(m=>'<div><span>🗺️ '+escapeText(m.name)+' <small>Quái cấp '+Math.min(...(sourceMap().get(m.id)||[0]))+'–'+Math.max(...(sourceMap().get(m.id)||[0]))+'</small></span><button data-resource-travel="'+m.id+'">Đến</button></div>').join('')+'</div></details>':
  '<p class="muResourceNoDrop">Chưa xác định bản đồ có quái đạt điều kiện rơi.</p>';
 const crafted=new Set(['hornpiece','brokenhorn']);
 const eventMaterials={pink:'Thỏ Ngọc hoặc Medusa trong thời gian sự kiện',purple:'Thỏ Ngọc hoặc Medusa trong thời gian sự kiện'};
 const materialDetail=(key)=>{
  const names=materials(),level=['splinter','guardian','claw'].includes(key)?80:['feather','crest'].includes(key)?30:1;
  const recipes=(state.crafting.recipes||[]).filter(r=>r.materials?.[key]||r.gems?.[key]||r.material===key);
  const event=eventMaterials[key],isCrafted=crafted.has(key),list=!event&&!isCrafted?areas(level):[];
  return '<h3>'+escapeText(names[key])+'</h3><p>Đang có: <strong>'+fmt(getCount(key))+'</strong></p>'
   +(event?'<p>🎁 Nguồn nhận: '+escapeText(event)+'</p>':
    isCrafted?'<p>⚒️ Nguồn nhận: Ghép tại Lò Chaos; nguyên liệu không rơi trực tiếp từ quái.</p>':
    '<p>Quái cấp phù hợp (tham chiếu điều kiện vật phẩm): '+level+' trở lên. Vị trí dưới đây là khu vực <strong>có khả năng rơi</strong>, không bảo đảm mỗi quái đều rơi món này.</p>'+mapList(list,'Bản đồ có quái phù hợp'))
   +'<h4>Công thức liên quan</h4>'+(recipes.length?recipes.map(r=>'<p class="muResourceRecipe">⚒️ '+escapeText(r.name)+'</p>').join(''):'<p>Chưa có công thức trong phiên bản hiện tại.</p>');
 };
 const isAvailable=it=>it.visualReady===true&&it.drop!==false;
 const itemLevel=it=>Math.max(1,Number(it.sourceDropLevel??it.sourceRequiredLevel??it.requiredLevel??1)||1);
 const itemDetail=it=>{
  if(!it)return '<p>Chọn một vật phẩm để xem nơi có thể rơi.</p>';
  const available=isAvailable(it),req=itemLevel(it),maps=available?areas(req):[];
  const kind=String(it.kind||'item');
  const gear=kind==='gear'||!!it.slot;
  let where;
  if(it.drop===false||it.visualReady===false)where='<p class="muResourceNoDrop">Vật phẩm nằm trong danh mục gốc nhưng <strong>chưa có nguồn rơi quái đang hoạt động</strong> trong MU H5.</p>';
  else if(['wing','mount'].includes(String(it.slot)))where='<p>🪽 Nguồn nhận: Lò Chaos, các công thức chế tạo và phần thưởng Hộp Kundun/sự kiện khi có trong bảng thưởng. Không phải trang bị rơi ngẫu nhiên từ quái thường.</p>';
  else if(kind==='book')where='<p>📖 Sách kỹ năng có thể rơi từ quái khi cấp quái phù hợp kỹ năng và đúng hệ nhân vật.</p>'+mapList(areas(req),'Bản đồ có quái đủ cấp');
  else if(kind==='gem')where='<p>💎 Ngọc cơ bản có thể nhận khi đánh quái tại các bản đồ hoạt động.</p>'+mapList(areas(1),'Bản đồ đánh quái');
  else if(kind==='kundunBox90')where='<p>🎁 Nguồn: Boss Vàng, thưởng World Boss hoặc sự kiện tùy cấp hộp. Không có nguồn quái thường được xác nhận.</p>';
  else if(gear)where='<p>Quái cấp từ '+Math.max(1,req-10)+' có thể tạo món này theo bộ lọc vật phẩm của máy chủ. Danh sách bản đồ là <strong>vị trí rơi tiềm năng</strong> — không phải bảo đảm rơi.</p>'+mapList(maps,'Bản đồ có quái đủ điều kiện');
  else where='<p>Nguồn nhận có thể là quái, sự kiện hoặc công thức tùy loại vật phẩm. Chưa có quy tắc rơi quái riêng được xác thực cho ID này.</p>';
  const allowed=it.classes?.length?it.classes.join(', '):'Theo điều kiện vật phẩm';
  return '<div class="muResourceSelected"><div class="muResourceItemHero">'
    +(it.icon?'<img src="assets/mu03/'+escapeText(it.icon)+'" alt="">':'<span>📦</span>')
    +'<div><h3>'+escapeText(it.name||it.definitionId)+'</h3>'
    +'<small>ID '+escapeText(it.definitionId||'không xác định')+' · '+escapeText(kind)+' · Cấp nguồn '+req+'</small>'
    +'<small>Hệ: '+escapeText(allowed)+'</small></div></div>'+where+'</div>';
 };
 function render(){
  if(modalMode!=='resourceGuide'||!state)return;
  const isMaterial=tab==='materials',entries=isMaterial?
   Object.entries(materials()).filter(([id,name])=>String(name).toLowerCase().includes(query.toLowerCase())||id.toLowerCase().includes(query.toLowerCase())).map(([id,name])=>({id,name})):
   (definitions||[]).filter(it=>String(it.name||'').toLowerCase().includes(query.toLowerCase())||String(it.definitionId||'').toLowerCase().includes(query.toLowerCase())).map((it,i)=>({id:String(it.definitionId||i),name:it.name||'Vật phẩm',item:it}));
  const batch=entries.slice(page*30,(page+1)*30);
  if(!batch.some(it=>it.id===selected))selected=batch[0]?.id||'';
  const active=batch.find(it=>it.id===selected)||entries.find(it=>it.id===selected)||null;
  const main=isMaterial?materialDetail(active?.id):itemDetail(active?.item||definitions?.find(it=>String(it.definitionId)===selected));
  const pages=Math.max(1,Math.ceil(entries.length/30));
  modal('<div class="muResourceGuide"><header><h2>📖 Tài nguyên & Nơi rơi vật phẩm</h2><small>Dữ liệu lấy từ danh mục vật phẩm và cấp quái hiện có trong MU H5</small></header>'
   +'<nav class="muResourceTabs"><button data-resource-tab="materials" '+(isMaterial?'aria-current="true"':'')+'>💎 Ngọc / Nguyên liệu</button><button data-resource-tab="items" '+(!isMaterial?'aria-current="true"':'')+'>⚔️ Trang bị / Vật phẩm</button></nav>'
   +'<input id="muResourceSearch" placeholder="Tìm tên hoặc mã vật phẩm..." value="'+escapeText(query)+'" aria-label="Tìm tài nguyên">'
   +'<p class="muResourceCount">'+fmt(entries.length)+' kết quả · Trang '+(page+1)+'/'+pages+'</p>'
   +'<div class="muResourceLayout"><div class="muResourceList">'+batch.map(it=>'<button data-resource-item="'+escapeText(it.id)+'" '+(it.id===selected?'class="selected"':'')+'>'+escapeText(it.name)+(isMaterial?'<small> ×'+fmt(getCount(it.id))+'</small>':(it.item?.visualReady===false?'<small>Chưa phát hành</small>':''))+'</button>').join('')
   +'<div class="muResourcePager"><button data-resource-page="'+(page-1)+'" '+(!page?'disabled':'')+'>‹ Trước</button><button data-resource-page="'+(page+1)+'" '+(page>=pages-1?'disabled':'')+'>Sau ›</button></div></div>'
   +'<section class="muResourceDetails">'+main+'</section></div>'
   +'<p class="muResourceDisclaimer">Thông tin nơi rơi dựa trên bộ lọc cấp quái, danh mục đang được mở và dữ liệu sự kiện. Các vật phẩm chưa phát hành không được gán nguồn rơi giả.</p>'
   +'<button id="resourceClose">Đóng</button></div>','resourceGuide');
  $('#resourceClose').onclick=()=>{$('#close')?.click()};
  const input=$('#muResourceSearch');
  if(input)input.oninput=e=>{const value=e.target.value;query=value;page=0;selected='';render();const x=$('#muResourceSearch');x?.focus();try{x?.setSelectionRange(value.length,value.length)}catch{}};
 }
 async function open(){
  if(!state)return;
  const token=++serial;
  modal('<h2>📖 Tài nguyên</h2><p>Đang tải danh mục và thông tin quái theo bản đồ...</p>','resourceGuide');
  if(!requesting||!definitions||!sources||Date.now()-loadAt>180000){
   requesting=Promise.allSettled([
    fetch('assets/mu03/source-items.json').then(r=>{if(!r.ok)throw Error('Thiếu danh mục item');return r.json()}),
    api('features135',{action:'materials'}).then(r=>r.featuresResult135?.sources||[])
   ]).then(rows=>{
    if(rows[0].status==='fulfilled')definitions=rows[0].value;
    if(rows[1].status==='fulfilled')sources=rows[1].value;
    loadAt=Date.now();
   }).finally(()=>{requesting=null});
  }
  try{await requesting}catch{}
  if(token!==serial||modalMode!=='resourceGuide')return;
  definitions ||= [];sources ||= [];
  page=0;query='';selected='';render();
 }
 document.addEventListener('click',async e=>{
  if(modalMode!=='resourceGuide')return;
  const tabEl=e.target.closest('[data-resource-tab]');
  if(tabEl){tab=tabEl.dataset.resourceTab;selected='';page=0;query='';render();return}
  const item=e.target.closest('[data-resource-item]');
  if(item){selected=item.dataset.resourceItem;render();return}
  const pg=e.target.closest('[data-resource-page]');
  if(pg){page=Number(pg.dataset.resourcePage);selected='';render();return}
  const map=e.target.closest('[data-resource-travel]');
  if(map){map.disabled=true;try{apply(await api('map',{id:Number(map.dataset.resourceTravel)}));$('#close')?.click();}catch(err){toast(err.message);map.disabled=false;}}
 });
 // Appended at the very end of the client script chain. Captures late wrappers.
 const before=renderInventory;
 renderInventory=function(){
  const result=before();
  if(modalMode!=='inventory')return result;
  const root=$('#modalBody'),panel=root?.querySelector('#selectedItem');
  if(!panel)return result;
  // The user wants this inside the same equipment card, not a detached large box.
  const set=panel.querySelector(':scope > .muSetDetails'),card=panel.querySelector('.item');
  if(set&&card){card.appendChild(set);const match=/·\s*(\d+)\/(\d+)/.exec(set.querySelector('summary')?.textContent||'');set.open=Number(match?.[1]||0)>=2;}
  root.querySelector('#dictionary')?.remove();
  root.querySelector('#bagPoints')?.remove();
  for(const el of root.querySelectorAll('#selectedItem .gear62details, #selectedItem .muItemLC'))el.remove();
  // The resource guide replaces the two separate resource/item dictionaries.
  const tools=root.querySelector('.inventoryToolbar');
  if(tools){
   const dict=root.querySelector('#materials135');
   if(!dict){const b=document.createElement('button');b.id='materials135';tools.appendChild(b);}
   const resource=root.querySelector('#materials135');
   resource.textContent='Tài nguyên';resource.onclick=()=>{tab='materials';void open()};
   if(resource.parentNode!==tools)tools.appendChild(resource);
   const wing=root.querySelector('#openForge');if(wing)wing.textContent='Cánh / Thú';
   const quick=root.querySelector('#quickSell');if(quick)quick.textContent='Bán nhanh';
   root.querySelectorAll('#panel89SellBooks, #sellKnownBooks').forEach(b=>{b.textContent='Bán sách';if(b.parentElement!==tools)tools.appendChild(b)});
  }
  const storage=root.querySelector('#openWarehouse');
  if(storage)storage.textContent='Kho';
  const actions=panel.querySelector('.muEquipActions');
  if(actions&&actions.parentNode!==card)card?.appendChild(actions);
  // Keep the lock option available but out of the main three-button row.
  const lock=panel.querySelector('[data-lock135]');
  const enhance=panel.querySelector('.muEquipActions [data-enhance]');
  if((lock||enhance)&&!panel.querySelector(':scope > .muItemMore')){
   const more=document.createElement('details');more.className='muItemMore';
   more.innerHTML='<summary>⚙ Gia cường / Tùy chọn</summary>';
   if(enhance){
    const forge=document.createElement('button');forge.type='button';
    forge.dataset.forge90=enhance.dataset.enhance;forge.textContent='⚒ Gia cường / Khảm';
    more.appendChild(forge);
   }
   if(lock&&lock.parentElement===panel)more.appendChild(lock);
   panel.appendChild(more);
  }
  return result;
 };
 // Reuse this resource guide from the Chaos Forge instead of opening
 // the older text-only materials encyclopedia.
 const oldForge=openForge;
 openForge=function(...args){
  const result=oldForge(...args);
  const button=$('#forgeMaterials135');
  if(button){button.textContent='Tài nguyên';button.onclick=()=>{tab='materials';void open()};}
  return result;
 };
 window.MU_RESOURCES={open};
})();
