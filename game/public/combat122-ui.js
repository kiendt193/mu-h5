'use strict';
(function(){
 // Prefer converted client FX and eliminate the hand-drawn normal attack streak.
 const previous=MU_FX.draw;
 const keys={slash:'slash',spin:'spin',fire:'fire',ice:'ice',spirit:'spirit',arrow:'arrow',multi:'multi',icearrow:'icearrow'};
 function bitmap(ctx,e,a,project){if(e.skill)return false;const key=(e.effect&&e.effect!=='slash'?keys[e.effect]:null)||((e.classId==='elf')?'arrow':(e.classId==='wizard'||e.classId==='summoner')?'fire':e.classId==='fighter'?'spirit':'slash'),im=MU_FX.textures[key];if(!im)return false;const count=im.width>im.height*2?Math.round(im.width/im.height):1,sw=im.width/count,frame=Math.min(count-1,Math.floor(a*count)),from=project(e.fromX??e.x,e.fromY??e.y),to=project(e.x,e.y),angle=Math.atan2(to.y-from.y,to.x-from.x),u=Math.min(1,a*2),ranged=['arrow','fire'].includes(key),x=ranged?from.x+(to.x-from.x)*u:(from.x+to.x)/2,y=(ranged?from.y+(to.y-from.y)*u:(from.y+to.y)/2)-32;
  ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,a*8)*Math.min(1,(1-a)*5);ctx.translate(x,y);ctx.rotate(angle);const size=key==='slash'?64:44;ctx.drawImage(im,frame*sw,0,sw,im.height,-size/2,-size/2,size,size);}finally{ctx.restore();}return true;
 }
 MU_FX.draw=function(ctx,list,dt,project){const alive=[],fallback=[],step=Math.min(.08,Math.max(0,Number(dt)||0)),budget=typeof MU_VISUAL6!=='undefined'&&MU_VISUAL6.quality==='low'?8:16;let drawn=0;if(typeof MU_NATIVE_FX!=='undefined')MU_NATIVE_FX.meshesThisFrame=0;
  for(const e of list.slice(-this.max)){const age=(e.t||0)+step,duration=this.duration(e);if(age>=duration)continue;const a=age/duration;let rendered=false;
   if(drawn<budget&&e.skill&&typeof MU_NATIVE_FX!=='undefined')rendered=MU_NATIVE_FX.gpu(e,a,project)||MU_NATIVE_FX.sprite(ctx,e,a,project);
   if(drawn<budget&&!e.skill)rendered=bitmap(ctx,e,a,project);
   if(rendered){e.t=age;e.native122=true;alive.push(e);drawn++;}else if(!e.skill){e.t=age;alive.push(e);}else if(drawn<budget){e.native122=false;fallback.push(e);drawn++;}else{e.t=age;e.native122=true;alive.push(e);}
  }
  const native=typeof MU_NATIVE_FX!=='undefined'?MU_NATIVE_FX:null,cap=native?.maxMeshes,used=native?.meshesThisFrame||0;let legacy;try{if(native&&Number.isFinite(cap))native.maxMeshes=Math.max(0,cap-used);legacy=previous.call(this,ctx,fallback,dt,project);}finally{if(native){native.maxMeshes=cap;native.meshesThisFrame=used+(native.meshesThisFrame||0);}}return [...alive,...legacy].slice(-this.max);
 };
 window.MU_COMBAT122={bitmap};
})();
