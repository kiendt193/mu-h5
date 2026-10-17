'use strict';
// Pose textures keep immutable storage. Alternating skeletons must not resize one
// GPU texture on every draw; cached poses must not overwrite pending GPU reads.
const MU_PALETTE87=(()=>{
 class Palette{
  constructor(gl,limit=128){this.gl=gl;this.limit=limit;this.entries=[];this.lookup=new WeakMap();this.serial=0;this.allocations=0;this.uploads=0;this.hits=0;}
  bind(pose){
   if(!pose?.length)throw Error('Empty bone palette');
   const g=this.gl,serial=++this.serial;let entry=this.lookup.get(pose);
   g.activeTexture(g.TEXTURE1);
   if(entry){entry.used=serial;this.hits++;g.bindTexture(g.TEXTURE_2D,entry.texture);return;}
   const capacity=Math.max(256,2**Math.ceil(Math.log2(pose.length)));
   if(this.entries.length<this.limit){entry={texture:g.createTexture(),capacity,used:serial};this.entries.push(entry);}
   else{
    entry=this.entries.reduce((a,b)=>a.used<b.used?a:b);
    this.lookup.delete(entry.pose);
    if(entry.capacity<pose.length){g.deleteTexture(entry.texture);entry.texture=g.createTexture();entry.capacity=capacity;entry.allocated=false;}
   }
   g.bindTexture(g.TEXTURE_2D,entry.texture);
   if(!entry.allocated){
    g.texStorage2D(g.TEXTURE_2D,1,g.RGBA32F,4,entry.capacity);
    g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST);
    g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);
    entry.allocated=true;this.allocations++;
   }
   let flat=pose.flatBuffer;
   if(!flat){flat=new Float32Array(pose.length*16);pose.forEach((m,i)=>flat.set(m,i*16));pose.flatBuffer=flat;}
   g.texSubImage2D(g.TEXTURE_2D,0,0,0,4,pose.length,g.RGBA,g.FLOAT,flat);
   entry.pose=pose;entry.used=serial;this.lookup.set(pose,entry);this.uploads++;
  }
  dispose(){for(const e of this.entries)this.gl.deleteTexture(e.texture);this.entries=[];this.lookup=new WeakMap();}
 }
 let pool=null;
 return {Palette,bind(runtime,pose){if(!pool||pool.gl!==runtime.gl){pool?.dispose();pool=new Palette(runtime.gl);if(runtime.boneTexture){runtime.gl.deleteTexture(runtime.boneTexture);runtime.boneTexture=null;}}pool.bind(pose);runtime.lastPose=pose;runtime.poseHeight=pose.length;},report(){return pool?{textures:pool.entries.length,allocations:pool.allocations,uploads:pool.uploads,cacheHits:pool.hits}:{};}};
})();
if(typeof module!=='undefined')module.exports=MU_PALETTE87;
