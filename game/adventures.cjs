'use strict';
const crypto=require('crypto'),rules=require('./adventure-rules.json');
const day=now=>new Date(now+7*3600000).toISOString().slice(0,10);
function init(c,now=Date.now()){c.adventures ||= {lifetime:{kills:0,boss:0,dungeon:0},achievements:[],tickets:{devil:0,blood:0}};const a=c.adventures;a.lifetime ||= {kills:0,boss:0,dungeon:0};a.achievements ||= [];a.tickets ||= {devil:0,blood:0};if(a.day!==day(now)){a.day=day(now);a.daily={kills:0,boss:0,dungeon:0};a.claimed=[];a.entries={devil:0,blood:0};}return a;}
function create({D,P,W,SP,MAPS,mobs,mobsByMap,players,stats,changed,dropEventGem=()=>{},clock=Date.now}){
 const runs=new Map(),history=new Set(),seasonalHistory=new Set();let serial=0,bossWindow=null,lastPulse=0;
 const visible=(p,m)=>m.instance?m.instance===runs.get(p.user.character.id)?.id:!runs.has(p.user.character.id);
 const same=(p,q)=>runs.get(p.user.character.id)?.id===runs.get(q.user.character.id)?.id;
 function addMob(map,pos,{name,sourceId,level,hp,damage,instance,boss=false,fixed=false,seasonalEvent=null}){const r={map,rect:[Math.floor(pos.x/32)-8,Math.floor(pos.y/32)-8,Math.floor(pos.x/32)+8,Math.floor(pos.y/32)+8],range:4};const m={id:'adv-'+(++serial),map,name,sourceId,level,hp,maxHp:hp,damage,regen:2147483647,spawnDef:r,home:{...pos},...pos,hitAt:0,target:null,attackAt:0,instance,eventBoss:boss,seasonalEvent,adventure:true,fixed};mobs.push(m);mobsByMap[map].push(m);return m;}
 function remove(set){for(let i=mobs.length-1;i>=0;i--)if(set(mobs[i])){const m=mobs[i],list=mobsByMap[m.map],j=list.indexOf(m);if(j>=0)list.splice(j,1);mobs.splice(i,1);}}
 function teleport(p,map,pos){const c=p.user.character;c.map=map;c.adventureActive=undefined;p.x=pos.x;p.y=pos.y;p.target=null;p.route=[];p.navPath=[];p.vector=[0,0];p.auto=false;p.action='idle';p.hp=stats(c).maxHp;p.mp=stats(c).maxMp;}
 function finish(p,success,reason){const c=p.user.character,r=runs.get(c.id);if(!r)return;runs.delete(c.id);remove(m=>m.instance===r.id);const a=init(c,clock());if(success){a.daily.dungeon++;a.lifetime.dungeon++;c.gold+=r.rule.rewardZen;c.gems ||= {};if(r.rule.rewardSoul)c.gems.soul=(c.gems.soul||0)+r.rule.rewardSoul;if(r.rule.rewardBless)c.gems.bless=(c.gems.bless||0)+r.rule.rewardBless;P.gainXp(c,Math.floor(Math.max(1000,P.xpRequired(c.level)*.2)));}c.adventureLast={name:r.rule.name,success,reason,at:clock(),zen:success?r.rule.rewardZen:0};teleport(p,0,MAPS[0].spawn);changed();}
 function battleMap(map){return MAPS[map]?.trainMap??map;}
 function position(map){map=battleMap(map);const p=SP.train(map);if(p)return p;for(let y=16;y<8176;y+=32)for(let x=16;x<8176;x+=32)if(W.walk(map,x,y)&&!W.safe(map,x,y))return{x,y};throw Error('Bản đồ chưa có khu chiến đấu');}
 function mobPosition(r,i){const candidates=[];for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){const p={x:r.origin.x+x*32,y:r.origin.y+y*32};if(W.walk(r.map,p.x,p.y)&&!W.safe(r.map,p.x,p.y)&&W.segment(r.map,r.origin.x,r.origin.y,p.x,p.y))candidates.push(p);}if(candidates.length<2)throw Error('Thiếu điểm sinh quái có đường đi');return candidates[(i*7+3)%candidates.length];}
 function stage(p,r){
 const lvl=r.level,grade=lvl>=300?3:lvl>=150?2:1;
 let specs=[];
 if(r.kind==='devil'){
  const groups=[
   [[14,'Binh đoàn Xương'],[19,'Yeti'],[37,'Quỷ'],[39,'Độc ảnh']],
   [[39,'Độc ảnh'],[55,'Vua Xương'],[144,'Thiên sứ tử thần']],
   [[37,'Quỷ'],[55,'Vua Xương'],[144,'Thiên sứ tử thần'],[268,'Thiên sứ địa ngục']]
  ];
  const pool=groups[Math.min(grade-1+Math.floor((r.stage-1)/2),groups.length-1)];
  specs=Array.from({length:Math.min(18,8+r.stage*2)},(_,i)=>({name:pool[i%pool.length][1]+' · Đợt '+r.stage,sourceId:pool[i%pool.length][0],scale:1+r.stage*.3}));
 }else if(r.kind==='chaos'){
  specs=Array.from({length:18},(_,i)=>({name:'Lính canh Hỗn Nguyên',sourceId:i%4?162:173,scale:1.4}));
 }else if(r.stage===1){
  const pool=grade===1?[[14,'Lính Xương'],[19,'Yeti']]:grade===2?[[55,'Vua Xương'],[56,'Xương Tử Thần']]:[[144,'Thiên sứ tử thần'],[55,'Vua Xương']];
  specs=Array.from({length:16},(_,i)=>({name:'Cầu Huyết Lâu · '+pool[i%pool.length][1],sourceId:pool[i%pool.length][0],scale:1.4}));
 }else if(r.stage===2)specs=[{name:'Cổng thành Blood Castle',sourceId:131,scale:12,fixed:true}];
 else if(r.stage===3)specs=[{name:'Tượng thánh · Vũ khí thiên thần',sourceId:132,scale:14,fixed:true}];
 const st=stats(p.user.character);for(const [i,t]of specs.entries()){
  const pos=mobPosition(r,i),hp=Math.max(250,Math.round(st.damage*6*t.scale));
  const mob=addMob(r.map,pos,{name:t.name,sourceId:t.sourceId,level:r.level,hp,damage:t.fixed?0:Math.max(10,Math.round(st.maxHp*.02+st.defense*.3)),instance:r.id,fixed:!!t.fixed});
  mob.target=p.user.id;
 }
 r.remaining=specs.length;
 r.score??=0;
}
 function enter(p,kind){const c=p.user.character,a=init(c,clock()),rule=rules.dungeons[kind];if(!rule)throw Error('Phụ bản không hợp lệ');if(runs.has(c.id))throw Error('Đang ở trong phụ bản');if(p.hp<=0)throw Error('Đang hồi sinh');if(c.level<rule.minLevel)throw Error('Cần cấp '+rule.minLevel);if((a.entries[kind]||0)>=rule.dailyLimit)throw Error('Đã hết lượt hôm nay');if((a.tickets[kind]||0)<1)throw Error('Cần mua vé phụ bản');const pos=position(rule.map),r={id:crypto.randomUUID(),kind,rule,map:rule.map,level:c.level,origin:pos,stage:1,until:clock()+rule.minutes*60000,remaining:0,score:0,castleRank:Math.min(7,Math.floor((c.level-1)/60)+1)};mobPosition(r,0);a.tickets[kind]--;a.entries[kind]=(a.entries[kind]||0)+1;runs.set(c.id,r);teleport(p,r.map,pos);c.adventureActive={kind,at:clock()};stage(p,r);changed();}
 function onKill(p,m){const c=p.user.character,a=init(c,clock());if(!visible(p,m))return true;a.daily.kills++;a.lifetime.kills++;if(m.seasonalEvent){
  dropEventGem(p,m,m.seasonalEvent==='rabbit'?(Math.random()<.5?'pink':'purple'):'pink',m.seasonalEvent==='medusa'?2:1);
  if(m.seasonalEvent==='medusa')dropEventGem(p,m,'purple',2);
  changed();
 }
 if(m.eventBoss){a.daily.boss++;a.lifetime.boss++;c.gold+=100000;c.gems ||= {};c.gems.bless=(c.gems.bless||0)+1;const ex=D.makeDrop(c,Math.max(m.level,c.level));if(ex?.kind==='gear'&&!['wing','mount'].includes(ex.slot)){ex.rarity='excellent';ex.excellent=[{id:'damage',value:5}];if(c.inventory.length<40)c.inventory.push(ex);else{c.warehouse ||= [];if(c.warehouse.length<2000)c.warehouse.push(ex);else c.gold+=50000;}}changed();}
 if(!m.instance)return false;const r=runs.get(c.id);
 if(!r||r.id!==m.instance)return true;m.hp=0;m.deadUntil=Number.MAX_SAFE_INTEGER;m.target=null;r.score+=(m.level||1)*100;
 P.gainXp(c,(r.kind==='devil'?4:2)*(30+m.level*12));c.gold+=15+m.level*5;
 if(--r.remaining===0){
  if(r.kind==='devil'&&r.stage<r.rule.waves||r.kind==='blood'&&r.stage<3){r.stage++;stage(p,r);}
  else if(r.kind==='blood'){r.stage=4;r.relicGround={x:m.x,y:m.y};r.relic=false;}
  else finish(p,true,r.kind==='chaos'?'Đã sống sót và đánh bại lính canh Hỗn Nguyên':'Hoàn thành Quảng trường Quỷ · '+r.score+' điểm');
 }
 changed();return true;}
 function seasonalSlot(rule,now){
 const local=new Date(now+7*3600000);const hour=local.getUTCHours(),minute=local.getUTCMinutes();
 if(!rule.hours.includes(hour)||minute<rule.minute||minute>=rule.minute+rule.durationMinutes)return null;
 return day(now)+':'+hour+':'+rule.minute;
 }
 function seasonalPulse(now){
  for(const [kind,rule]of Object.entries(rules.seasonal||{})){
   const active=seasonalSlot(rule,now);
   for(let i=mobs.length-1;i>=0;i--)if(mobs[i].seasonalEvent===kind&&!active){
    const m=mobs[i],a=mobsByMap[m.map],index=a.indexOf(m);if(index>=0)a.splice(index,1);mobs.splice(i,1);
   }
   if(!active||seasonalHistory.has(kind+':'+active))continue;
   seasonalHistory.add(kind+':'+active);
   if(seasonalHistory.size>60)seasonalHistory.delete(seasonalHistory.values().next().value);
   const map=battleMap(rule.map),origin=position(map);
   for(let j=0;j<rule.count;j++){
    const dx=(j%4-1)*45,dy=(Math.floor(j/4)-1)*45;
    const pos=W.near(map,origin.x+dx,origin.y+dy,32)||origin;
    addMob(map,pos,{name:rule.name,sourceId:rule.sourceId,level:rule.level,hp:rule.hp,damage:rule.damage,seasonalEvent:kind});
   }
   changed();
  }
 }
 function slot(now){const start=Math.floor(now/1800000)*1800000;return now-start<rules.boss.durationMinutes*60000?String(start):null;}
 function pulse(now=clock()){if(now-lastPulse<1000)return;lastPulse=now;seasonalPulse(now);for(const [id,r]of runs){const p=[...players.values()].find(p=>p.user.character.id===id);if(!p){runs.delete(id);remove(m=>m.instance===r.id);continue;}if(p.hp<=0)finish(p,false,'Nhân vật bị hạ');else if(p.user.character.map!==r.map)finish(p,false,'Đã rời phụ bản');else if(now>=r.until)finish(p,false,'Hết thời gian');}
 const current=slot(now);if(bossWindow!==current){remove(m=>m.eventBoss);bossWindow=current;}if(current&&!history.has(current)){history.add(current);if(history.size>24)history.delete(history.values().next().value);for(const b of rules.boss.list){const map=battleMap(b.map),pos=position(map);addMob(map,pos,{...b,boss:true});}changed();}for(const m of mobs)if(m.adventure&&m.hp>0&&m.instance){const p=[...players.values()].find(p=>runs.get(p.user.character.id)?.id===m.instance);if(p)m.target=p.user.id;}}
 function nextBoss(now){return (Math.floor(now/1800000)+1)*1800000;}
 function view(p){const c=p.user.character,a=init(c,clock()),r=runs.get(c.id);return{day:a.day,nextBoss:nextBoss(clock()),bossActive:!!bossWindow,bosses:rules.boss.list.map(b=>({...b,alive:mobs.some(m=>m.eventBoss&&m.sourceId===b.sourceId&&m.hp>0)})),dungeons:Object.entries(rules.dungeons).map(([id,d])=>({id,...d,tickets:a.tickets[id]||0,entered:a.entries[id]||0})),seasonal:Object.entries(rules.seasonal||{}).map(([id,d])=>({id,name:d.name,map:d.map,modelIsFallback:!!d.modelIsFallback,active:mobs.some(m=>m.seasonalEvent===id&&m.hp>0)})),run:r?{name:r.rule.name,kind:r.kind,stage:r.stage,remaining:r.remaining,until:r.until,relic:!!r.relic,relicGround:r.relicGround||null,score:r.score||0,origin:r.origin}:null,last:c.adventureLast,daily:rules.daily.map(q=>({...q,current:a.daily[q.counter]||0,claimed:a.claimed.includes(q.id)})),achievements:rules.achievements.map(q=>({...q,current:a.lifetime[q.counter]||0,claimed:a.achievements.includes(q.id)}))};}
 function act(p,b){const c=p.user.character,a=init(c,clock());if(b.action==='enter')enter(p,b.kind);else if(b.action==='leave')finish(p,false,'Chủ động rời phụ bản');else if(b.action==='relicPickup'){
 const r=runs.get(c.id);
 if(!r||r.kind!=='blood'||r.stage!==4||!r.relicGround||r.relic)throw Error('Chưa phá tượng và làm rơi vũ khí Thiên thần');
 if(Math.hypot(p.x-r.relicGround.x,p.y-r.relicGround.y)>110)throw Error('Hãy đến gần kiếm Thiên thần trên bản đồ');
 r.relic=true;r.relicGround=null;
 }else if(b.action==='returnRelic'){const r=runs.get(c.id);if(!r?.relic)throw Error('Chưa nhặt vũ khí Thiên thần');if(Math.hypot(p.x-r.origin.x,p.y-r.origin.y)>140)throw Error('Hãy đến gần Thiên thần ở điểm vào phụ bản');finish(p,true,'Đã trả vũ khí thiên thần cho Thiên thần');}else if(b.action==='ticket'){const rule=rules.dungeons[b.kind];if(!rule||c.gold<rule.ticketPrice)throw Error('Thiếu Zen hoặc loại vé không hợp lệ');if(a.tickets[b.kind]>=99)throw Error('Đã có đủ vé');c.gold-=rule.ticketPrice;a.tickets[b.kind]=(a.tickets[b.kind]||0)+1;}else if(b.action==='claim'||b.action==='achievement'){const achievement=b.action==='achievement',q=(achievement?rules.achievements:rules.daily).find(q=>q.id===b.id),claimed=achievement?a.achievements:a.claimed,counters=achievement?a.lifetime:a.daily;if(!q||(counters[q.counter]||0)<q.goal||claimed.includes(q.id))throw Error('Chưa đủ điều kiện hoặc đã nhận thưởng');claimed.push(q.id);c.gold+=q.zen;if(q.gem){c.gems ||= {};c.gems[q.gem]=(c.gems[q.gem]||0)+1;}}else if(b.action==='bossMove'){if(runs.has(c.id))throw Error('Rời phụ bản trước');const b0=rules.boss.list.find(x=>x.id===b.id),m=b0&&mobs.find(x=>x.eventBoss&&x.sourceId===b0.sourceId&&x.hp>0);if(!m)throw Error('Boss chưa xuất hiện hoặc đã bị hạ');if(c.level<b0.level)throw Error('Cần cấp '+b0.level);teleport(p,m.map,W.near(m.map,m.x+64,m.y)||m.home);}else throw Error('Thao tác không hợp lệ');changed();}
 function cancel(p){if(runs.has(p.user.character.id))finish(p,false,'Đã rời phụ bản');}
 function npcs(p,normal){const r=runs.get(p.user.character.id);if(!r)return normal;if(r.kind!=='blood')return [];return[{id:'adventure-angel',name:'Thiên thần · Trả vũ khí',x:r.origin.x,y:r.origin.y,cellX:Math.floor(r.origin.x/32),cellY:Math.floor(r.origin.y/32),sourceId:232,icon:null}];}
 return{npcs,visible,same,enter,onKill,pulse,view,act,cancel,runs};
}
function recover(c){if(c.adventureActive){c.map=0;delete c.adventureActive;c.adventureLast={success:false,reason:'Phiên phụ bản đã kết thúc khi ngắt kết nối',at:Date.now()};}init(c);}
module.exports={create,rules,init,day,recover};
