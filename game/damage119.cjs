'use strict';
// Short-lived hit events are retained for action replies and delta snapshots.
const queues=new WeakMap();let serial=0;
const RETAIN_MS=1800,MAX_EVENTS=96;
function record(player,mob,amount,critical=false,kind='hit',at=Date.now()){
 if(player.isAI||!Number.isFinite(amount)||amount<=0)return;
 const rows=(queues.get(player)||[]).filter(e=>at-e.at<RETAIN_MS);
 rows.push({id:++serial,at,map:mob.map,target:mob.id,x:mob.x,y:mob.y,amount:Math.round(amount),critical:!!critical,kind});
 if(rows.length>MAX_EVENTS)rows.splice(0,rows.length-MAX_EVENTS);
 queues.set(player,rows);
}
function view(player,map,now=Date.now()){
 const rows=(queues.get(player)||[]).filter(e=>now-e.at<RETAIN_MS&&e.map===map);
 queues.set(player,rows);return rows;
}
module.exports={record,view,RETAIN_MS,MAX_EVENTS};
