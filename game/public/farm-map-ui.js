'use strict';
/* Dedicated playable Farm destination, backed by existing persisted garden90. */
(function(){
 const FARM_MAP=73;
 let garden=null,loading=false,lastFetch=0,lastPaint='',lastError='';
 const safe=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const money=n=>Math.round(Number(n)||0).toLocaleString('vi-VN');
 const now=()=>Date.now();
 const img=(key,label,style='')=>{
  const source=window.MU_HAPPY_FARM_ART?.[key];
  return source?'<img alt="'+safe(label)+'" src="'+source+'" style="'+style+'">':'<span class="muFarmEmoji">'+safe(label)+'</span>';
 };
 const icons={carrot:'🥕',tomato:'🍅',rice:'🌾',flower:'🌺',apple:'🍎',chicken:'🐔',cow:'🐄',bee:'🐝',sheep:'🐑'};
 const asset={carrot:'lfruit',tomato:'lfruit',rice:'hoa',flower:'hoa',apple:'lfruit',chicken:'ga',cow:'cuahanggiasuc_1',bee:'ong',sheep:'thu'};
 const produceLabels={egg:'🥚',feather:'🪶',milk:'🥛',honey:'🍯',wool:'🐑'};
 const root=document.createElement('div');
 root.id='muFarmWorld';root.hidden=true;root.setAttribute('aria-label','Bản đồ Nông trại');
 document.body.appendChild(root);
 const present=()=>typeof state!=='undefined'&&!!state&&state.character?.map===FARM_MAP&&document.getElementById('login')?.hidden;
 async function call(action,details={}){
  if(loading)return;
  loading=true;root.classList.add('busy');lastError='';
  try{
   const response=await api('life90',{action,...details});
   if(response.me)apply(response);
   if(response.life90)garden=response.life90.garden;
   const result=response.lifeResult90;
   if(result?.message)toast(result.message);
   if(action==='gardenEnter'){garden=response.life90?.garden||garden;document.querySelector('#close')?.click();}
   if(action==='gardenLeave'){garden=null;root.hidden=true;}
   await refresh(false);
  }catch(e){lastError=e.message||'Không thể thao tác';toast(lastError);paint(true);}
  finally{loading=false;root.classList.remove('busy')}
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
  const active=present();
  root.hidden=!active;
  if(!active){lastPaint='';return}
  paint();
  if(!garden&&now()-lastFetch>3000){lastFetch=now();void refresh(false)}
 }
 function time(t){const n=Math.max(0,Math.round(t/60000));return n>=60?Math.floor(n/60)+'g '+String(n%60).padStart(2,'0')+'p':n+' phút'}
 function viewPlot(p){
  const isEmpty=p.kind==='empty';
  const key=isEmpty?'soil':(p.type||'soil');
  const icon=icons[key]||'🌱',image=asset[key];
  const imgHtml=image?img(image,icon,'object-fit:contain;width:60px;height:56px;image-rendering:pixelated'):img('soil','🌱');
  const title=isEmpty?'Ô đất trống':p.name;
  const description=isEmpty?'Sẵn sàng gieo/nuôi':p.ready?'✨ Thu hoạch được':p.stage==='needsCare'?'Cần chăm sóc':p.percent+'%';
  const badge=p.ready?'<em class="ready">SẴN SÀNG</em>':'';
  return '<button type="button" data-plot="'+p.index+'" class="muFarmPlot '+(p.ready?'ready':'')+'">'
   +'<span class="muFarmPlotArt">'+imgHtml+(!image?'<span>'+safe(icon)+'</span>':'')+'</span>'
   +'<strong>'+safe(title)+'</strong><small>'+safe(description)+'</small>'
   +(isEmpty?'':'<span class="muFarmBar"><i style="width:'+Math.max(0,Math.min(100,p.percent||0))+'%"></i></span>')+badge+'</button>';
 }
 function products(g){
  const stock=Object.entries(g.stock||{}).filter(([,count])=>count>0);
  if(!stock.length)return '<p class="muFarmHint">Kho còn trống, hãy thu hoạch hoa quả hoặc sản phẩm thú.</p>';
  return stock.map(([id,count])=>{
   const def=g.products?.[id];const name=def?.name||id;
   return '<div class="muFarmProduct"><span>'+safe(produceLabels[id]||icons[id]||'📦')+'</span><b>'+safe(name)+'</b><small>×'+money(count)+'</small><strong>'+money(count*(def?.zen||0))+' Zen</strong><button data-sell="'+safe(id)+'">Bán</button></div>';
  }).join('');
 }
 function render(g){
  return '<div class="muFarmPage"><header class="muFarmTop"><div><small>MU H5 · BẢN ĐỒ RIÊNG</small><h1>🌿 Nông trại Hạnh Phúc</h1><p>Gieo hạt, chăm thú, thu hoạch và mang ngọc về chiến đấu</p></div><div class="muFarmTopButtons"><span>💰 '+money(state.character?.gold)+' Zen</span><button data-refresh="1">↻ Làm mới</button><button class="muFarmExit" data-leave="1">↪ Về bản đồ cũ</button></div></header>'
  +'<div class="muFarmLand"><div class="muFarmFarmhouse">'+img('nhaKho','🏠','image-rendering:pixelated;height:86px;width:auto;object-fit:contain')+'<span>NHÀ KHO</span></div><div class="muFarmLandTitle">RUỘNG CÂY & CHUỒNG NUÔI</div>'
  +'<section class="muFarmPlots">'+g.plots.map(viewPlot).join('')+'</section>'
  +'<div class="muFarmDecoration">'+img('hangRao','🌳','height:26px;object-fit:fill;width:100%')+'</div></div>'
  +'<div class="muFarmSidebar"><section><h2>🌱 Trồng cây</h2><div class="muFarmCards">'+Object.entries(g.crops).map(([id,v])=>'<button data-plant="'+safe(id)+'" title="'+safe(v.name)+'">'+(asset[id]?img(asset[id],icons[id],'image-rendering:pixelated;object-fit:contain;width:39px;height:39px'):safe(icons[id]))+'<strong>'+safe(v.name)+'</strong><small>'+money(v.seedZen)+' Zen</small></button>').join('')+'</div></section>'
  +'<section><h2>🐾 Nuôi thú</h2><div class="muFarmCards">'+Object.entries(g.animals).map(([id,v])=>'<button data-animal="'+safe(id)+'">'+(asset[id]?img(asset[id],icons[id],'image-rendering:pixelated;object-fit:contain;width:39px;height:39px'):safe(icons[id]))+'<strong>'+safe(v.name)+'</strong><small>'+money(v.buyZen)+' Zen</small></button>').join('')+'</div></section>'
  +'<section class="muFarmWarehouse"><h2>📦 Kho nông sản</h2>'+products(g)+'<div class="muFarmActionRow"><button data-harvest-all="1">✨ Thu hoạch tất cả</button><button data-sell-all="1">💰 Bán nhanh toàn bộ</button></div></section></div>'
  +'<footer class="muFarmFoot"><span>🎲 7,7% cơ hội nhận ngọc · 0,8% nhận Hộp Kundun · 23,5% nhận Zen thưởng mỗi lượt thu hoạch.</span><button data-unlock="1" '+(g.plots.length>=g.maxPlots?'disabled':'')+'>+ Mở ô · '+money(g.unlockZen)+' Zen</button></footer>'
  +(lastError?'<p class="muFarmError">'+safe(lastError)+'</p>':'')+'</div>';
 }
 let selected=0;
 function detail(p,g){
  if(!p)return;
  if(p.kind==='empty'){
    toast('Chọn một cây hoặc thú bên phải để nuôi tại ô '+(selected+1));return;
  }
  const actions=p.kind==='crop'?
   '<button data-care="gardenWater" '+(p.watered?'disabled':'')+'>💧 Tưới nước</button>':
   '<button data-care="gardenFeed" '+(p.fed?'disabled':'')+'>🌾 Cho ăn · 500 Zen</button><button data-care="gardenClean" '+(p.cleaned?'disabled':'')+'>🧹 Vệ sinh</button>';
  const remaining=Math.max(0,(g[p.kind==='crop'?'crops':'animals'][p.type]?.duration||0)*(1-(p.percent||0)/100));
  const html='<h2>'+safe(p.name)+' — Ô '+(selected+1)+'</h2><p>Tiến độ '+p.percent+'%'+(p.ready?' · ✨ Đã sẵn sàng':' · còn khoảng '+time(remaining))+'</p><div class="muFarmDetailActions">'+actions+'<button data-care="gardenHarvest" '+(!p.ready?'disabled':'')+'>🧺 Thu hoạch</button></div>';
  document.querySelector('#muFarmSelection')?.remove();
  const dlg=document.createElement('div');dlg.id='muFarmSelection';dlg.innerHTML='<section>'+html+'<button data-close-selection="1">×</button></section>';root.appendChild(dlg);
 }
 function paint(force=false){
  if(!present()||!garden)return;
  const signature=JSON.stringify([state.character?.id,garden,state.character?.gold,lastError]);
  if(!force&&signature===lastPaint)return;
  lastPaint=signature;root.innerHTML=render(garden);
 }
 root.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b||loading)return;
  if(b.dataset.plot!==undefined){selected=Number(b.dataset.plot);detail(garden?.plots[selected],garden);return}
  if(b.dataset.closeSelection){document.getElementById('muFarmSelection')?.remove();return}
  if(b.dataset.plant){await call('gardenPlant',{index:selected,type:b.dataset.plant});return}
  if(b.dataset.animal){await call('gardenAnimal',{index:selected,type:b.dataset.animal});return}
  if(b.dataset.care){await call(b.dataset.care,{index:selected});return}
  if(b.dataset.harvestAll){await call('gardenHarvestAll');return}
  if(b.dataset.sellAll){await call('gardenSellAll');return}
  if(b.dataset.sell){await call('gardenSell',{product:b.dataset.sell});return}
  if(b.dataset.unlock){await call('gardenUnlock');return}
  if(b.dataset.refresh){await refresh(true);return}
  if(b.dataset.leave){await call('gardenLeave');return}
 });
 // Reuse the existing Khác → Gia viên entry, but teleport into farm world first.
 document.addEventListener('click',e=>{
  const target=e.target.closest('[data-life-menu="garden"]');
  if(target&&!loading){e.preventDefault();e.stopPropagation();void call('gardenEnter');}
 },true);
 const originalApply=apply;
 apply=function(packet){
  const response=originalApply(packet);
  if(packet.life90?.garden)garden=packet.life90.garden;
  show();
  return response;
 };
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&present())void refresh(false)});
 setInterval(()=>{if(!present())return;if(Date.now()-lastFetch>18000)void refresh(false);else show();},5000);
 show();
})();
