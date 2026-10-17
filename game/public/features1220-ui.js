'use strict';
(()=>{
 const images=new Map();let actor=null,catalog=null,pendingCatalog=null,serverClock=0,clockAt=0;
 const oldApply1224=apply;apply=function(packet){if(Number.isFinite(packet?.now)&&packet.now>=serverClock){serverClock=packet.now;clockAt=performance.now();}return oldApply1224(packet);};
 const animationClock=()=>serverClock?serverClock+Math.max(0,performance.now()-clockAt):Date.now();
 const url=p=>typeof MU_CACHE==='undefined'?p:MU_CACHE.url(p);
 function image(p){if(!images.has(p)){const im=new Image();im.src=url(p);images.set(p,im);}return images.get(p);}
 const beforePerson=person;
 person=function(p,time){
  const previous=actor,art=p.life90TitleArt1220,im=art&&image(art.url),ready=im?.complete&&im.naturalWidth>0&&Number.isInteger(art.frames)&&art.frames>0&&Number.isInteger(art.cols)&&art.cols>0&&art.width>0&&art.height>0&&im.naturalWidth===art.cols*art.width&&im.naturalHeight>=Math.ceil(art.frames/art.cols)*art.height;
  actor=ready?p:null;const own=ready&&p.id===state?.me.id,oldTitle=state?.life90Title;
  const oldActorTitle=p.life90Title;if(ready)p.life90Title=null;
  if(own)state.life90Title=null;
  try{return beforePerson(p,time);}
  finally{actor=previous;if(ready)p.life90Title=oldActorTitle;if(own)state.life90Title=oldTitle;}
 };
 const beforeLabel=label;
 label=function(x,y,text,color){
  if(actor&&text===actor.name+' · '+actor.level){
   const a=actor.life90TitleArt1220,im=image(a.url),frame=Math.floor(animationClock()/Math.max(16,a.frameMs||120))%a.frames;
   const width=Math.min(156,Math.max(112,a.width*.65))*.6,height=width*a.height/a.width;
   ctx.save();if(a.pulseMs)ctx.globalAlpha=.94+.06*Math.sin(animationClock()/a.pulseMs*Math.PI*2);ctx.drawImage(im,(frame%a.cols)*a.width,Math.floor(frame/a.cols)*a.height,a.width,a.height,x-width/2,y-(actor.life90Guild?30:12)-height,width,height);ctx.restore();
  }
  return beforeLabel(x,y,text,color);
 };
 async function titles(){
  if(catalog)return catalog;if(!pendingCatalog)pendingCatalog=fetch('assets/titles1220/catalog.json').then(r=>{if(!r.ok)throw Error('title catalog');return r.json();}).then(rows=>catalog=rows).catch(()=>{pendingCatalog=null;return[];});return pendingCatalog;
 }
 let scheduled=false;
 const host=$('#modalBody');
 function decorate(){
  if(!host||!state)return;
  for(const row of host.querySelectorAll('#mapDestinations .item')){
   const move=row.querySelector('[data-map]'),m=move&&state.maps[Number(move.dataset.map)];
   if(!m?.overview1220||row.querySelector('[data-map-preview1220]'))continue;
   const b=document.createElement('button');b.textContent='Xem sơ đồ';b.dataset.mapPreview1220=m.id;row.appendChild(b);
  }
  if(modalMode==='titles90'&&!host.querySelector('.titleCatalog1220')){
   const section=document.createElement('section');section.className='titleCatalog1220';host.appendChild(section);
   titles().then(rows=>{if(!section.isConnected||modalMode!=='titles90')return;for(const row of rows){const button=host.querySelector('[data-title90="'+row.id+'"]'),card=button?.closest('.life90card');if(card&&!card.querySelector('.titlePreview1220')){const im=document.createElement('img');im.className='titlePreview1220';im.loading='lazy';im.src=url(row.art1220.preview);im.alt=row.name;card.insertBefore(im,card.firstChild);}}section.innerHTML='<h3>20 danh hiệu bổ sung</h3><p class="muted">Mở khóa theo số lần reset. Chỉ cộng chỉ số của một danh hiệu đang đeo.</p><div class="titleGrid1220">'+rows.map(t=>'<article><img loading="lazy" src="'+escape(url(t.art1220.preview))+'" alt="'+escape(t.name)+'"><strong>'+escape(t.name)+'</strong><small>Reset '+t.min+' · '+((state.character.resetCount||0)>=t.min?'Đã mở · Đeo ở danh sách phía trên':'Chưa mở')+'</small></article>').join('')+'</div>';});
  }
 }
 if(host)new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}).observe(host,{childList:true,subtree:true});
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-map-preview1220]');if(!b)return;
  const m=state?.maps[Number(b.dataset.mapPreview1220)];if(!m?.overview1220||m.available===false)return;
  modal('<h2>'+escape(m.name)+'</h2><p>Sơ đồ khu vực.</p><img class="mapPreview1220" src="'+escape(url(m.overview1220))+'" alt="'+escape(m.name)+'"><button id="mapBack1220">Danh sách bản đồ</button>','mapPreview1220');$('#mapBack1220').onclick=()=>$('#maps').click();
 });
 const css=document.createElement('style');css.textContent='.titlePreview1220{display:block;width:200px;max-width:100%;height:72px;object-fit:contain}.titleGrid1220{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.titleGrid1220 article{padding:8px;border:1px solid #6b5b3f;background:#081019;text-align:center;min-width:0}.titleGrid1220 img{display:block;width:100%;height:64px;object-fit:contain}.titleGrid1220 strong,.titleGrid1220 small{display:block}.titleGrid1220 small{color:#bfb99f;font-size:11px}.mapPreview1220{display:block;width:min(512px,100%);height:auto;margin:12px auto;image-rendering:auto}';document.head.appendChild(css);
})();
