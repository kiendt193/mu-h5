'use strict';
// Drops do not move after insertion. Keep a map-scoped spatial index in sync with ownership Map.
class DropIndex extends Map {
 constructor(){super();this.cells=new Map();this.keys=new Map();}
 key(d){return d.map+':'+Math.floor(d.x/256)+':'+Math.floor(d.y/256);}
 set(id,d){if(super.has(id))this.delete(id);const key=this.key(d);let cell=this.cells.get(key);if(!cell)this.cells.set(key,cell=new Set());cell.add(id);this.keys.set(id,key);return super.set(id,d);}
 delete(id){const key=this.keys.get(id),cell=this.cells.get(key);cell?.delete(id);if(cell?.size===0)this.cells.delete(key);this.keys.delete(id);return super.delete(id);}
 clear(){super.clear();this.cells?.clear();this.keys?.clear();}
 *near(map,x,y,radius){const r2=radius*radius;for(let yy=Math.floor((y-radius)/256);yy<=Math.floor((y+radius)/256);yy++)for(let xx=Math.floor((x-radius)/256);xx<=Math.floor((x+radius)/256);xx++)for(const id of this.cells.get(map+':'+xx+':'+yy)||[]){const d=this.get(id);if((d.x-x)**2+(d.y-y)**2<=r2)yield d;}}
}
module.exports={DropIndex};
