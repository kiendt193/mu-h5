'use strict';
(()=>{
 const host=document.querySelector('.dialog');if(!host)return;
 function decorate(){if(!state)return;for(const row of host.querySelectorAll('#mapDestinations .item')){
  const button=row.querySelector('[data-map]'),m=button&&state.maps[Number(button.dataset.map)];
  if(!m?.trainingCamps1221||row.querySelector('[data-camps1221]'))continue;
  const b=document.createElement('button');b.textContent='Bãi train ('+m.trainingCamps1221.length+')';b.dataset.camps1221=m.id;row.appendChild(b);
 }}
 new MutationObserver(decorate).observe(host,{childList:true,subtree:true});
 host.addEventListener('click',e=>{const button=e.target.closest('[data-camps1221]');if(!button)return;
  const m=state?.maps[Number(button.dataset.camps1221)];if(!m||m.available===false)return;
  modal('<h2>'+escape(m.name)+' · Bãi train</h2><p>Trong thành là vùng an toàn; ra ngoài thành có quái. Di chuyển đến bãi trong cùng map miễn phí; đổi map tính Zen theo giá bản đồ.</p>'+m.trainingCamps1221.map(c=>'<article class="item"><div>'+escape(c.name)+'<small>'+escape(c.monster)+' · Quái cấp '+c.monsterLevel+' · '+c.quantity+' con · Tọa độ '+c.cellX+', '+c.cellY+'</small></div><button data-train1221="'+escape(c.id)+'" '+(state.character.level<m.level||state.character.level>m.maxLevel?'disabled':'')+'>Đến bãi</button></article>').join('')+'<button id="trainBack1221">Danh sách bản đồ</button>','train1221');
  $('#trainBack1221').onclick=()=>$('#maps').click();for(const b of host.querySelectorAll('[data-train1221]'))b.onclick=async()=>{if(await action('trainCamp1221',{id:b.dataset.train1221}))$('#modal').hidden=true;};
 });
})();
