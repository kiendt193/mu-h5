'use strict';
// World Boss hourly rotation (Asia/Ho_Chi_Minh). Original MU source monster IDs
// are reused: no fake or external visual assets.
const tiers=[
 ['Rồng cổ đại',43,100000000],
 ['Tử Vong Vương',55,200000000],
 ['Nữ Hoàng Băng Giá',25,500000000],
 ['Tantalos Hoàng Kim',82,1000000000],
 ['Chiến Tướng Balram',316,1500000000],
 ['Băng Cự Nhân',456,2000000000],
 ['Chúa Tể Bóng Tối',559,5000000000],
 ['Ma Vương Condra',575,10000000000],
 ['Thần Rắn Vasuki',686,20000000000],
 ['Thủ Lĩnh Vực Sâu',726,50000000000]
].map(([name,sourceId,hp],index)=>Object.freeze({index,name,sourceId,hp,level:100+index*10,damage:Math.round(1500+index*400)}));
const HOUR=3600000,lifeMs=20*60000,costs=[1,3,5,7,10];
const hourIndex=now=>Math.floor(now/HOUR);
const bossFor=now=>tiers[((hourIndex(now)%tiers.length)+tiers.length)%tiers.length];
const slot=now=>{
 const hour=Math.floor(now/HOUR)*HOUR;
 return now-hour<lifeMs?String(hour):null;
};
const next=now=>(hourIndex(now)+1)*HOUR;
const agenda=(now,count=24)=>Array.from({length:Math.max(0,Math.min(24,count))},(_,i)=>{
 const at=Math.floor(now/HOUR)*HOUR+(i+1)*HOUR;
 return {at,...bossFor(at)};
});
function death(c,p,m,now=Date.now()){
 if(!m?.worldBoss110||m.guildBoss135||p.isAI)return false;
 const id=m.id,prev=c.worldBossRevival;
 const count=prev?.id===id?Math.max(0,Math.min(5,prev.count||0)):0;
 const step=count+1;
 c.worldBossRevival={id,count:step,deadAt:now,map:c.map};
 p.bossRevive={id,step,cost:step<=5?costs[step-1]:null,at:now,map:c.map,forceTown:step>=6};
 p.respawnAt=Number.MAX_SAFE_INTEGER;
 p.auto=false;p.target=null;p.vector=[0,0];p.route=[];p.navPath=[];
 return true;
}
function view(c,p){
 if(p.hp>0||!p.bossRevive)return null;
 const r=p.bossRevive;return {step:r.step,cost:r.cost,forceTown:r.forceTown,points:c.phucDuyen||0,at:r.at,map:r.map,message:r.forceTown?'Đã gục 6 lần: tự về thành.':'Hồi sinh tại chỗ hoặc về thành.'};
}
function revive(c,p,action,MAPS,stats,now=Date.now()){
 const r=p.bossRevive;
 if(!r||p.hp>0)throw Error('Bạn chưa bị boss hạ');
 if(now<r.at+1000)throw Error('Vui lòng chờ 1 giây');
 if(!['here','town'].includes(action))throw Error('Lựa chọn hồi sinh không hợp lệ');
 if(action==='here'&&r.forceTown)throw Error('Lần thứ 6 bắt buộc về thành');
 if(action==='here'){
  if(!Number.isSafeInteger(c.phucDuyen||0)||(c.phucDuyen||0)<r.cost)throw Error('Không đủ '+r.cost+' Phúc duyên');
  c.phucDuyen-=r.cost;
 }else{
  c.map=MAPS[c.map]?.respawnMap??c.map;
  const pos=MAPS[c.map].spawn;p.x=pos.x;p.y=pos.y;
  c.worldBossRevival={id:null,count:0,deadAt:now,map:c.map};
 }
 const s=stats(c);p.hp=s.maxHp;p.mp=s.maxMp;
 p.respawnAt=0;p.bossRevive=null;p.target=null;p.vector=[0,0];p.auto=false;
 p.route=[];p.navPath=[];p.action='idle';
 p.bossReviveInvulnerableUntil=now+2500;
 return {action,remaining:c.phucDuyen||0,step:r.step};
}
module.exports={tiers,HOUR,lifeMs,costs,bossFor,slot,next,agenda,death,view,revive};
