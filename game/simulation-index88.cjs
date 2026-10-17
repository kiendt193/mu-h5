'use strict';
const CELL=256,SIZE=32;
class SimulationIndex {
 constructor(){this.maps=[];this.players=[];this.order=new WeakMap();}
 rebuild(mobs,players){this.maps=[];this.players=[];let ordinal=0;for(const m of mobs){this.order.set(m,ordinal++);if(m.hp<=0)continue;const map=this.maps[m.map]??=new Map(),key=Math.floor(m.y/CELL)*SIZE+Math.floor(m.x/CELL),list=map.get(key);if(list)list.push(m);else map.set(key,[m]);}for(const p of players){if(p.hp<=0)continue;(this.players[p.user.character.map]??=[]).push(p);}}
 nearest(p,eligible){const map=this.maps[p.user.character.map];if(!map)return null;const cx=Math.floor(p.x/CELL),cy=Math.floor(p.y/CELL);let best=null,d=Infinity;for(let r=0;r<SIZE;r++){for(let y=Math.max(0,cy-r);y<=Math.min(SIZE-1,cy+r);y++)for(let x=Math.max(0,cx-r);x<=Math.min(SIZE-1,cx+r);x++){if(r&&Math.max(Math.abs(x-cx),Math.abs(y-cy))!==r)continue;const list=map.get(y*SIZE+x);if(!list)continue;for(const m of list){if(m.hp<=0)continue;const dist=(p.x-m.x)**2+(p.y-m.y)**2;if((dist<d||dist===d&&this.order.get(m)<this.order.get(best))&&eligible(m)){best=m;d=dist;}}}const edge=Math.min(p.x-(cx-r)*CELL,(cx+r+1)*CELL-p.x,p.y-(cy-r)*CELL,(cy+r+1)*CELL-p.y);if(best&&d<edge*edge)break;}return best;}
 awake(m){for(const p of this.players[m.map]||[]){if(p.hp<=0||p.user.character.map!==m.map)continue;const radius=p.isAI?640:2400;if((p.x-m.x)**2+(p.y-m.y)**2<=radius*radius)return true;}return false;}
}
module.exports={SimulationIndex};
