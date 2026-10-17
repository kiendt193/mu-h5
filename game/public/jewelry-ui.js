'use strict';
Object.assign(slotNames,{ring1:'Nhẫn 1',ring2:'Nhẫn 2',necklace:'Vòng cổ'});
const jewelryView=itemView;itemView=function(it,equipped=false){return jewelryView(it,equipped)+(!equipped&&['ring1','ring2'].includes(it.slot)?'<p>Chọn ô nhẫn: <button data-ring-item="'+escape(it.id)+'" data-ring-slot="ring1">Mặc Nhẫn 1</button> <button data-ring-item="'+escape(it.id)+'" data-ring-slot="ring2">Mặc Nhẫn 2</button></p>':'');};
const jewelryInventory=renderInventory;renderInventory=function(){jewelryInventory();for(const b of document.querySelectorAll('[data-ring-item]'))b.onclick=async()=>{b.disabled=true;await action('equip',{id:b.dataset.ringItem,slot:b.dataset.ringSlot});if(b.isConnected)b.disabled=false;};};
