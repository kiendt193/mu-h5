'use strict';
(function(){
 function update(){
  document.querySelectorAll('#identity .sd71').forEach(el=>el.remove());
  if(!state||modalMode!=='points')return;
  const host=document.querySelector('#attributeDetails')||document.querySelector('#modalBody');
  if(!host)return;
  let row=host.querySelector('#characterSd');
  if(!row){row=document.createElement('p');row.id='characterSd';host.appendChild(row);}
  const current=Number(state.me.sd),maximum=Number(state.me.maxSd);
  row.textContent='SD (lá chắn): '+(Number.isFinite(current)?Math.round(current):0)+' / '+(Number.isFinite(maximum)?Math.round(maximum):0);
 }
 const previousApply=apply;apply=function(r){previousApply(r);update();};
 const previousOpen=openPoints;openPoints=function(id){previousOpen(id);update();};
 update();
})();
