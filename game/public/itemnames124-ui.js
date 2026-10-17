'use strict';
(function(){
 let catalog={names:{},visual:{}};
 function item(it){if(!it||it.kind==='book'||it.kind==='pet'||!(it.kind==='gear'||it.slot))return it;const colors={red:'đỏ',black:'đen',blue:'xanh',gold:'hoàng kim'};const id=it.definitionId||catalog.visual[it.appearance]||catalog.visual[it.key],name=it.slot==='mount'&&colors[it.mount]?'Sói tinh '+colors[it.mount]:catalog.names[id];if(name)it.name=name;return it;}
 function character(c){if(!c)return;for(const it of [...Object.values(c.gear||{}),...(c.inventory||[]),...(c.warehouse||[]),...(c.gearRecovery||[]),c.equipment])item(it);}
 function snapshot(r){character(r?.character);for(const actor of [r?.me,...(r?.players||[])])if(actor)for(const it of Object.values(actor.gear||{}))item(it);for(const drop of r?.drops||[])item(drop.item);for(const recipe of r?.crafting?.recipes||[])item(recipe.preview);return r;}
 const beforeApply=apply;apply=function(r){return beforeApply(snapshot(r));};const beforeView=itemView;itemView=function(it,...args){return beforeView(item(it),...args);};
 fetch('assets/mu03/item-names124.json?v=12.10').then(r=>{if(!r.ok)throw Error('Item names unavailable');return r.json();}).then(data=>{catalog=data;window.MU_ITEM_NAMES124={item,snapshot};if(typeof state!=='undefined'&&state){snapshot(state);if(modalMode==='inventory')renderInventory();else if(modalMode==='forge')openForge();}if(typeof MU_I18N!=='undefined')MU_I18N.schedule();}).catch(()=>{});
})();
