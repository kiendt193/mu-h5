'use strict';
(()=>{
 // Clean the requested menu only; storage remains accessible from inventory.
 const other=$('#otherTab').onclick;$('#otherTab').onclick=function(e){other?.call(this,e);const grid=$('.otherGrid');if(!grid)return;for(const b of grid.querySelectorAll('button')){const text=typeof MU_I18N!=='undefined'?MU_I18N.sourceText(b):b.textContent;if(b.dataset.other==='sound'||/Kho riêng|Từ điển item|Bật\s*\/\s*tắt âm thanh/.test(text))b.remove();}};
 const autoPanel=$('#autoSettings').onclick;$('#autoSettings').onclick=function(e){autoPanel?.call(this,e);return;const row=document.createElement('label');row.className='check';row.innerHTML='<input type="checkbox" id="autoSound810">Bật / tắt âm thanh';$('#saveAuto').before(row);const input=$('#autoSound810');input.checked=!!MU_AUDIO.enabled;input.onchange=()=>{if(input.checked!==!!MU_AUDIO.enabled)$('#sound').click();input.checked=!!MU_AUDIO.enabled;};if(typeof MU_I18N!=='undefined')MU_I18N.schedule();};
})();
