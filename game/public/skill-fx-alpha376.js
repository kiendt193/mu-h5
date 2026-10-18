'use strict';
/* MU original Skill FX WebP alpha restoration.
 * MU OZJ/JPEG sprites store glow on an opaque black matte. WebP conversion
 * retains that matte, which becomes dark square halos when texture filtering
 * or non-additive draws are involved. Restore soft alpha on the browser once
 * per source image, not in the animation loop. */
(()=>{
 const cache=new WeakMap();
 const stats={version:'2.8.376',processed:0,alreadyTransparent:0,blackMatteFixed:0,skippedOpaque:0,failed:0};
 const clamp=(x)=>Math.max(0,Math.min(1,x));
 function prepare(im){
  if(!im)return null;
  if(cache.has(im))return cache.get(im);
  const w=im.naturalWidth||im.width||0,h=im.naturalHeight||im.height||0;
  if(!w||!h||w>1024||h>1024){cache.set(im,null);return null;}
  try{
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const cx=canvas.getContext('2d',{willReadFrequently:true});
   if(!cx)throw Error('Canvas 2D context unavailable');
   cx.drawImage(im,0,0,w,h);
   const original=cx.getImageData(0,0,w,h),data=original.data;
   // Preserve existing OZT/PNG transparency; never alter alpha artwork.
   let preexisting=false;
   for(let i=3;i<data.length;i+=4)if(data[i]<253){preexisting=true;break;}
   if(preexisting){stats.alreadyTransparent++;cache.set(im,im);return im;}
   // Sample perimeter. Opaque game UI/pet images must not be black-keyed.
   let dark=0,total=0;
   const stride=Math.max(1,Math.floor(Math.min(w,h)/128));
   function edge(x,y){
    const k=(y*w+x)*4,v=Math.max(data[k],data[k+1],data[k+2]);
    if(v<64)dark++;
    total++;
   }
   for(let x=0;x<w;x+=stride){edge(x,0);if(h>1)edge(x,h-1);}
   for(let y=stride;y<h-1;y+=stride){edge(0,y);if(w>1)edge(w-1,y);}
   // Fully opaque bright/mixed tiles are not VFX glows; suppress rectangles
   // rather than making a bright square around the spell.
   if(!total||dark/total<.42){stats.skippedOpaque++;cache.set(im,null);return null;}
   let nonzero=0;
   for(let i=0;i<data.length;i+=4){
    const brightness=Math.max(data[i],data[i+1],data[i+2]);
    const t=clamp((brightness-10)/64);
    const feather=t*t*(3-2*t);
    data[i+3]=Math.round(255*feather);
    if(data[i+3])nonzero++;
   }
   if(!nonzero){stats.skippedOpaque++;cache.set(im,null);return null;}
   cx.putImageData(original,0,0);
   stats.processed++;stats.blackMatteFixed++;
   cache.set(im,canvas);
   return canvas;
  }catch(e){
   // Rendering unchanged opaque images could cause the original black halo.
   stats.failed++;if(stats.failed<3)console.warn('MU FX alpha conversion skipped:',e);
   cache.set(im,null);return null;
  }
 }
 window.MU_SKILL_ALPHA={prepare,stats};
 if(typeof module!=='undefined')module.exports={prepare,stats};
})();
