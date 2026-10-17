'use strict';
(()=>{
 const profiles={230:'knight',250:'merchant',251:'knight',253:'elf',255:'elf',244:'elf',254:'wizard',379:'elf',246:'knight',545:'elf',242:'elf',243:'knight',415:'elf',416:'elf',417:'wizard',245:'wizard',259:'wizard',577:'elf',578:'knight',248:'merchant'};
 const images=new Map();for(const type of ['knight','wizard','elf']){const im=new Image();im.src=typeof MU_CACHE!=='undefined'?MU_CACHE.url('assets/npcs1236/'+type+'-idle.webp'):'assets/npcs1236/'+type+'-idle.webp';images.set(type,im);}
 const previous=drawShopNpc;drawShopNpc=function(npc,p){const type=profiles[npc.sourceNpc];if(!type||type==='merchant')return previous(npc,p);const im=images.get(type);if(!im?.complete||!im.naturalWidth)return previous(npc,p);const direction=Math.max(0,Math.min(7,Math.trunc((Number(npc.direction)||1)-1))),frame=Math.floor(performance.now()/420)%4,height=120,width=80;ctx.drawImage(im,frame*128,direction*192,128,192,p.x-width/2,p.y-height,width,height);};
 window.MU_TOWN_NPCS1236={profiles};
})();
