'use strict';
/* Show normal + Excellent set thresholds beneath equipment detail,
 * preserving Ancient set presentation and normal item option lines. */
(function(){
 const prior=itemView;
 const title=item=>String(item?.name||'').replace(/^(?:Mũ|Áo|Quần|Găng|Giày)\s+/i,'');
 function key(it){
  if(!it||it.rarity==='ancient'||it.ancient||it.kind!=='gear'||!state?.character)return null;
  if(['ring1','ring2','necklace'].includes(it.slot))return state.character.classId+':accessory';
  const m=/^(?:7|8|9|10|11):(\d+)$/.exec(it.definitionId||'');
  return m?state.character.classId+':armor:'+m[1]:null;
 }
 itemView=function(it,equipped=false){
  const base=prior(it,equipped),id=key(it);
  if(!id)return base;
  const group=(state?.stats?.excellentSets||[]).find(x=>x.id===id);
  const count=group?.count||0,excellent=group?.excellent||0,total=group?.pieces||(id.endsWith(':accessory')?3:5);
  const label=group?.name||(id.endsWith(':accessory')?'Bộ trang sức':'Bộ '+title(it));
  const row=bonus=>'<p style="color:'+(bonus.active?'#9bf3b3':'#a0a29b')+';margin:5px 0;font-size:12px">'+(bonus.active?'✦ ':'◇ ')+escape(bonus.name)+(bonus.requiresExcellent?' · EX '+excellent+'/'+bonus.need:' · '+count+'/'+bonus.need)+'</p>';
  const normal=total===3?[
   {need:2,name:'Hai trang sức: HP tối đa +3%',active:count>=2},
   {need:3,name:'Đủ nhẫn + dây chuyền: Sát thương +3%',active:count>=3},
   {need:2,name:'Hai trang sức Excellent: Chí mạng +2%',active:excellent>=2,requiresExcellent:true},
   {need:3,name:'Đủ trang sức Excellent: MP +4%',active:excellent>=3,requiresExcellent:true}
  ]:[
   {need:2,name:'Đồng bộ 2 món: Phòng thủ +3%',active:count>=2},
   {need:3,name:'Đồng bộ 3 món: HP +4%',active:count>=3},
   {need:4,name:'Đồng bộ 4 món: Sát thương +3%',active:count>=4},
   {need:5,name:'Đủ 5 món: MP +5%',active:count>=5},
   {need:2,name:'2 món EX: Chí mạng +2%',active:excellent>=2,requiresExcellent:true},
   {need:3,name:'3 món EX: Giảm sát thương +3%',active:excellent>=3,requiresExcellent:true},
   {need:5,name:'5 món EX: Sát thương +5%',active:excellent>=5,requiresExcellent:true}
  ];
  return base+'<section class="muNormalSetDetail" style="padding:9px;margin-top:7px;border:1px solid #669b73;background:#08150fd9">'
   +'<strong style="color:#a7e6a9">✦ '+escape(label)+' · '+count+'/'+total+' món (Excellent '+excellent+')</strong>'
   +normal.map(row).join('')
   +'<small>Đủ số món sẽ tự cộng vào thuộc tính và lực chiến; không biến thành đồ Thần.</small></section>';
 };
})();
