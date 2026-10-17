'use strict';
(()=>{
 function spec(p){return p?.riding?MU_LIVE.manifest?.models[p.gear?.mount?.mountModel]?.mount130:null;}
 function mountPose(p,time){const m=MU_LIVE.manifest?.models[p.gear?.mount?.mountModel],s=m?.mount130;if(!s)return null;const phase=p.action==='attack'?Math.min(.999,Math.max(0,(performance.now()-(p.actionTime||performance.now()))/400)):time/(p.action==='run'?.65:1.7);return livePose(m.animation,s.actions[p.action]||s.actions.idle,phase);}
 function riderPose(p,body,time){const s=spec(p),bones=mountPose(p,time),b=bones?.[s?.seat.bone];if(!b)return body;const v=s.seat.position,target=[0,1,2].map(k=>(b[k]*v[0]+b[4+k]*v[1]+b[8+k]*v[2]+b[12+k])*s.scale),delta=target.map((x,k)=>x-body[0][12+k]);return body.map(m=>{const out=new Float32Array(m);for(let k=0;k<3;k++)out[12+k]+=delta[k];return out;});}
 const oldAnimation=liveAnimation;liveAnimation=function(p,time){const a=oldAnimation(p,time),s=spec(p);if(s?.handler==='horse'){const action=p.action==='run'?81:p.action==='attack'?86:80;if(MU_LIVE.manifest?.rig.clips[action])a.action=action;}return a;};
 const oldRider=typeof liveHorseRiderPose==='function'?liveHorseRiderPose:(p,b)=>b;window.liveHorseRiderPose=function(p,body,time){return spec(p)?riderPose(p,body,time):oldRider(p,body,time);};
 const oldMesh=drawLiveMesh;drawLiveMesh=function(m,b,t,...args){if(m?.mount130){const s=m.mount130.scale;t=mul4(t,new Float32Array([s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1]));}return oldMesh(m,b,t,...args);};
 window.MU_MOUNTS130={spec,mountPose,riderPose};
})();
