'use strict';
(function(){
 const paths={
 'Từ điển item':'<path d="M12 5v16M12 6C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Z"/><path d="M5 8h4M5 11h4M15 8h4M15 11h4"/>',
 'Reset nhân vật':'<path d="M20 7a9 9 0 1 0 1 9M20 2v6h-6"/><path d="M12 7v5l3 2"/>',
 'Pet hỗ trợ':'<ellipse cx="6" cy="8" rx="2" ry="3" transform="rotate(-25 6 8)"/><ellipse cx="18" cy="8" rx="2" ry="3" transform="rotate(25 18 8)"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="14" cy="5" rx="2" ry="3"/><path d="M5 18c0-3 4-7 7-7s7 4 7 7c0 5-4 2-7 2s-7 3-7-2Z"/>'
 };
 const style=document.createElement('style');style.textContent='.otherGrid .menuVector svg{display:block;width:34px;height:34px;margin:0 auto;color:#d6bd7e}.otherGrid .menuVector{display:block;margin-bottom:12px;line-height:1}';document.head.appendChild(style);
 function fill(){const grid=document.querySelector('.otherGrid');if(!grid)return;for(const b of grid.querySelectorAll('button')){const name=b.textContent.trim().replace(/\s+/g,' '),path=paths[name];if(!path||b.querySelector('.menuVector'))continue;const span=document.createElement('span');span.className='menuVector';span.setAttribute('aria-hidden','true');span.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';b.prepend(span);}}
 const button=document.querySelector('#otherTab');if(!button)return;const previous=button.onclick;button.onclick=function(e){const result=previous?.call(this,e);fill();return result;};fill();
})();
