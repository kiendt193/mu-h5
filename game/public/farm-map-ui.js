'use strict';
/* Happy Farm 2.8: dedicated interactive scene, pixel crops cut from JAR sprite atlases,
   with old farm/N​eon state and backend actions preserved. */
(function(){
 const FARM_MAP=73;
 let garden=null,loading=false,lastFetch=0,lastPaint='',lastError='';
 let selected=0,tab='seeds';
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>Number(n||0).toLocaleString('vi-VN');
 const now=()=>Date.now();
 const icons={carrot:'🥕',tomato:'🍅',rice:'🌾',flower:'🌸',apple:'🍎',chicken:'🐓',cow:'🐄',bee:'🐝',sheep:'🐑'};
 const productIcons={carrot:'🥕',tomato:'🍅',rice:'🌾',flower:'🌸',apple:'🍎',egg:'🥚',feather:'🪶',milk:'🥛',honey:'🍯',wool:'🧶'};
 const root=document.createElement('div');root.id='muFarmWorld';root.hidden=true;
 root.setAttribute('aria-label','Bản đồ Nông trại');document.body.appendChild(root);
 const present=()=>typeof state!=='undefined'&&!!state&&state.character?.map===FARM_MAP&&document.getElementById('login')?.hidden;
 // JAR images are sprite SHEETS. A cropped CSS background prevents the former
 // 15×165 fruit image from being squeezed into a long vertical line.
 function sprite(sheet,x,y,w,h,scale=3){
  const src=window.MU_HAPPY_FARM_ART?.[sheet];
  if(!src)return '';
  return '<span class="farmPixel" aria-hidden="true" style="width:'+(w*scale)+'px;height:'+(h*scale)+'px;background-image:url('+src+');background-size:'+((sheet==='lfruit'?15:sheet==='hoa'?80:sheet==='ga'?120:40)*scale)+'px '+((sheet==='lfruit'?165:sheet==='hoa'?20:sheet==='ga'?18:120)*scale)+'px;background-position:-'+(x*scale)+'px -'+(y*scale)+'px"></span>';
 }
 function art(key,scale=3){
  // Frame coordinates come from the original HappyFarm JAR.
  switch(key){
   case 'rice':return sprite('lfruit',0,60,15,15,scale);
   case 'tomato':return sprite('lfruit',0,30,15,15,scale);
   case 'flower':return sprite('hoa',40,0,20,20,Math.max(2,scale-1));
   case 'apple':return '<span class="farmEmoji" aria-hidden="true">🍎</span>';
   case 'carrot':return '<span class="farmEmoji" aria-hidden="true">🥕</span>';
   case 'chicken':return sprite('ga',0,0,20,18,Math.max(2,scale-1));
   case 'bee':return sprite('ong',0,0,20,20,Math.max(2,scale-1));
   case 'cow':return '<span class="farmEmoji" aria-hidden="true">🐄</span>';
   case 'sheep':return '<span class="farmEmoji" aria-hidden="true">🐑</span>';
   default:return '<span class="farmEmoji" aria-hidden="true">🌱</span>';
  }
 }
 function ptime(ms){let minutes=Math.max(0,Math.ceil(ms/60000));if(minutes>=60)return Math.floor(minutes/60)+' giờ '+(minutes%60)+' phút';return minutes+' phút'}
 async function call(action,details={}){
  if(loading)return;
  loading=true;root.classList.add('busy');lastError='';
  try{
   const response=await api('life90',{action,...details});
   if(response.me)apply(response);
   if(response.life90?.garden)garden=response.life90.garden;
   if(response.lifeResult90?.message)toast(response.lifeResult90.message);
   if(action==='gardenEnter')document.querySelector('#close')?.click();
   if(action==='gardenLeave'){garden=null;root.hidden=true}
   await refresh(false);
  }catch(e){
   lastError=e.message||'Không thể thao tác';toast(lastError);paint(true);
  }finally{loading=false;root.classList.remove('busy')}
 }
 async function refresh(showError){
  if(!present()){show();return}
  if(loading&&garden){paint(true);return}
  try{
   const response=await api('life90',{action:'view'});
   garden=response.life90?.garden||garden;
   lastFetch=now();paint(true);
  }catch(e){if(showError)lastError=e.message||'Không lấy được dữ liệu nông trại';paint(true)}
 }
 function show(){
  const active=present();root.hidden=!active;
  if(!active){lastPaint='';return}
  if(!garden){root.innerHTML='<div class="farmBoot">🌿 Đang mở Nông trại Hạnh Phúc...</div>';if(now()-lastFetch>3000){lastFetch=now();void refresh(false)}return}
  paint();
 }
 function plotCard(p){
  const empty=p.kind==='empty',ready=!!p.ready;
  const label=empty?'Ô đất trống':p.name||'Đang phát triển';
  const working=!empty&&!p.stage.includes('needsCare');
  const percent=ready?100:Math.max(0,Math.min(100,p.percent||0));
  const seeded=working&&(p.kind==='crop');
  const visual=empty?'<span class="farmEmptyIcon">＋</span>':art(p.type||'rice',p.kind==='crop'?3:3);
  return '<button class="farmField'+(selected===p.index?' selected':'')+(ready?' ready':'')+(p.kind==='animal'?' animal':'')+'" data-plot="'+p.index+'" aria-label="Ô '+(p.index+1)+': '+safe(label)+'">'
   +'<span class="farmFieldNumber">#'+(p.index+1)+'</span><span class="farmPlant">'+visual+'</span>'
   +'<span class="farmFieldLabel">'+safe(label)+'</span>'
   +'<span class="farmFieldState">'+(empty?'Chọn giống để trồng':ready?'✦ Có thể thu hoạch':p.stage==='needsCare'?'⚠ Cần chăm sóc':percent+'% phát triển')+'</span>'
   +(!empty?'<span class="farmGrowth"><span style="width:'+percent+'%"></span></span>':'')
   +'</button>';
 }
 function plotDetail(g){
  const p=g.plots[selected];
  if(!p)return '<p>Chọn ô đất trên bản đồ.</p>';
  const empty=p.kind==='empty';
  if(empty)return '<span class="farmSelectedIcon">🪴</span><div class="farmSelectedInfo"><b>Ô '+(selected+1)+' · Đang trống</b><small>Chọn cây giống hoặc thú nuôi ở bảng bên dưới để bắt đầu.</small></div><span class="farmReadyLabel">Sẵn sàng</span>';
  const def=g[p.kind==='crop'?'crops':'animals']?.[p.type];
  const remain=Math.max(0,Number(def?.duration||0)*(1-(p.percent||0)/100));
  const title=safe(p.name||'Ô nuôi trồng');
  const status=p.ready?'Có thể thu hoạch':p.stage==='needsCare'?'Cần chăm sóc':'Còn khoảng '+ptime(remain);
  const care=p.kind==='crop'?
   '<button data-care="gardenWater" '+(p.watered?'disabled':'')+'>💧 '+(p.watered?'Đã tưới':'Tưới nước')+'</button>':
   '<button data-care="gardenFeed" '+(p.fed?'disabled':'')+'>🌾 '+(p.fed?'Đã cho ăn':'Cho ăn · 500 Zen')+'</button><button data-care="gardenClean" '+(p.cleaned?'disabled':'')+'>🧹 '+(p.cleaned?'Đã dọn':'Dọn chuồng')+'</button>';
  return '<span class="farmSelectedIcon">'+art(p.type,2)+'</span><div class="farmSelectedInfo"><b>Ô '+(selected+1)+' · '+title+'</b><small>'+safe(status)+'</small></div><div class="farmCareBtns">'+care+'<button class="farmHarvest" data-care="gardenHarvest" '+(!p.ready?'disabled':'')+'>🧺 Thu hoạch</button></div>';
 }
 function seedShop(g){
  const isSeeds=tab==='seeds';
  const inventory=isSeeds?g.crops:g.animals;
  const opts=Object.entries(inventory||{});
  return '<section class="farmShop"><div class="farmShopTabs"><button data-tab="seeds" '+(isSeeds?'aria-current="true"':'')+'>🌱 Giống cây</button><button data-tab="animals" '+(!isSeeds?'aria-current="true"':'')+'>🐾 Thú nuôi</button><button data-tab="stock">📦 Kho nông sản</button></div>'
  +(tab==='stock'?products(g):'<div class="farmShopGrid">'+opts.map(([key,item])=>'<button class="farmShopItem" data-'+(isSeeds?'plant':'animal')+'="'+safe(key)+'">'
    +'<span class="farmShopArt">'+art(key,2)+'</span><span><strong>'+safe(item.name||key)+'</strong><small>'+money(isSeeds?item.seedZen:item.buyZen)+' Zen</small></span></button>').join('')+'</div>')
  +'</section>';
 }
 function products(g){
  const all=Object.entries(g.stock||{}).filter(([,n])=>n>0);
  return '<div class="farmStock">'+(!all.length?'<div class="farmEmptyStock">🧺 Kho đang trống. Thu hoạch cây hoặc thú để có nông sản.</div>':
    '<div class="farmStockGrid">'+all.map(([key,n])=>'<div class="farmProduce"><span>'+safe(productIcons[key]||'📦')+'</span><strong>'+safe(g.products?.[key]?.name||key)+'</strong><small>×'+money(n)+'</small><button data-sell="'+safe(key)+'">Bán '+money(n*(g.products?.[key]?.zen||0))+' Zen</button></div>').join('')+'</div>')
  +'<div class="farmStockActions"><button data-harvest-all="1">🧺 Thu hoạch tất cả</button><button data-sell-all="1" '+(!all.length?'disabled':'')+'>💰 Bán nhanh kho</button></div></div>';
 }
 function render(g){
  if(selected>=g.plots.length)selected=Math.max(0,g.plots.length-1);
  const ready=g.plots.filter(p=>p.ready).length;
  return '<div class="farmWorldPage"><header class="farmWorldHeader"><div class="farmBrand"><span class="farmBrandGlyph">✿</span><span><small>MU H5 · KHU VỰC ĐẶC BIỆT</small><strong>Nông trại Hạnh Phúc</strong></span></div>'
   +'<div class="farmHeaderRight"><span class="farmZen">🪙 '+money(state.character?.gold)+' Zen</span><button data-refresh="1" aria-label="Làm mới" title="Làm mới">↻</button><button class="farmBack" data-leave="1">↩ Quay lại</button></div></header>'
   +'<div class="farmLayout"><main class="farmScene"><div class="farmSceneTitle"><span>🌤️ Khu vườn của bạn</span><small>'+g.plots.length+'/'+g.maxPlots+' ô đất · '+ready+' ô sẵn sàng</small></div>'
   +'<div class="farmScenery"><div class="farmDecor farmBarn"><span>'+(window.MU_FARM_BUILDINGS?.barn?'<img src="'+window.MU_FARM_BUILDINGS.barn+'" alt="Nhà kho">':'🏡')+'</span><small>Nhà kho</small></div><div class="farmDecor farmWell"><span>'+(window.MU_FARM_BUILDINGS?.well?'<img src="'+window.MU_FARM_BUILDINGS.well+'" alt="Giếng nước">':'🪣')+'</span><small>Giếng nước</small></div><div class="farmDecor farmTree"><span>🌳</span></div><div class="farmDecor farmTree second"><span>🌲</span></div><div class="farmDecor farmFence" aria-hidden="true"></div></div>'
   +'<div class="farmFieldArea">'+g.plots.map(plotCard).join('')+'</div><div class="farmFieldAction">'+plotDetail(g)+'</div>'
   +'<div class="farmSceneFooter"><button data-harvest-all="1" '+(!ready?'disabled':'')+'>🧺 Thu hoạch '+(ready?'('+ready+')':'')+'</button><button data-unlock="1" '+(g.plots.length>=g.maxPlots?'disabled':'')+'>＋ Mở ô · '+money(g.unlockZen)+' Zen</button></div></main>'
   +'<aside class="farmControl">'+seedShop(g)+'<div class="farmTips"><span>🎁 Thu hoạch có cơ hội nhận ngọc, Hộp Kundun và Zen thưởng.</span><small>Mỗi loại cây/thú cần chăm sóc và đủ thời gian mới thu hoạch được.</small></div></aside></div>'
   +(lastError?'<p class="farmError" role="alert">'+safe(lastError)+'</p>':'')+'</div>';
 }
 function paint(force=false){
  if(!present()||!garden)return;
  const signature=JSON.stringify([state.character?.id,garden,state.character?.gold,lastError,selected,tab]);
  if(!force&&signature===lastPaint)return;
  lastPaint=signature;root.innerHTML=render(garden);
 }
 root.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b||loading)return;
  if(b.dataset.plot!==undefined){selected=Number(b.dataset.plot);paint(true);return}
  if(b.dataset.tab){tab=b.dataset.tab;paint(true);return}
  if(b.dataset.plant){const p=garden?.plots[selected];if(p?.kind!=='empty'){toast('Chọn một ô đất trống để trồng cây');return}await call('gardenPlant',{index:selected,type:b.dataset.plant});return}
  if(b.dataset.animal){const p=garden?.plots[selected];if(p?.kind!=='empty'){toast('Chọn ô đất trống để nuôi thú');return}await call('gardenAnimal',{index:selected,type:b.dataset.animal});return}
  if(b.dataset.care){await call(b.dataset.care,{index:selected});return}
  if(b.dataset.harvestAll){await call('gardenHarvestAll');return}
  if(b.dataset.sellAll){await call('gardenSellAll');return}
  if(b.dataset.sell){await call('gardenSell',{product:b.dataset.sell});return}
  if(b.dataset.unlock){await call('gardenUnlock');return}
  if(b.dataset.refresh){await refresh(true);return}
  if(b.dataset.leave){await call('gardenLeave');return}
 });
 document.addEventListener('click',e=>{
  const target=e.target.closest('[data-life-menu="garden"]');
  if(target&&!loading){e.preventDefault();e.stopPropagation();void call('gardenEnter')}
 },true);
 const originalApply=apply;
 apply=function(packet){
  const response=originalApply(packet);
  if(packet.life90?.garden)garden=packet.life90.garden;
  show();return response;
 };
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&present())void refresh(false)});
 setInterval(()=>{if(!present())return;if(now()-lastFetch>18000)void refresh(false);else show()},5000);
 show();
})();
