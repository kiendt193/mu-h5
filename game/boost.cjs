const crypto=require('node:crypto');const DURATION=7200000;
const TYPES=[{id:'boost2',multiplier:2,cost:1000000},{id:'boost3',multiplier:3,cost:2000000}];
function item(t){return{id:crypto.randomUUID(),kind:'boost',boostType:t.id,multiplier:t.multiplier,duration:DURATION,name:'Thuốc x'+t.multiplier+' EXP & Zen · 2 giờ',icon:'icons/item-jewel03.webp',price:0,power:0};}
function multiplier(c,now=Date.now()){return c.rewardBoost?.until>now&&[2,3].includes(c.rewardBoost.multiplier)?c.rewardBoost.multiplier:1;}
function use(c,id,now=Date.now()){const i=c.inventory.findIndex(it=>it.id===id),it=c.inventory[i],t=TYPES.find(t=>t.id===it?.boostType);if(i<0||it.kind!=='boost'||!t)throw Error('Không có thuốc hợp lệ trong túi');c.rewardBoost={multiplier:t.multiplier,until:now+DURATION};c.inventory.splice(i,1);return c.rewardBoost;}
module.exports={TYPES,item,multiplier,use,DURATION};
