'use strict';
const P=require('./progression.cjs');const config=require('./rules/reset.json');
function view(c){const count=c.resetCount||0,row=config.rows.find(r=>count+1>=r.min&&count+1<=r.max);return{count,auto:!!c.autoReset,available:!!row,requiredLevel:row?.level,points:row?.points,zen:row?.zen,gems:row?.gems||{},ready:!!row&&c.level>=row.level&&c.gold>=row.zen&&Object.entries(row.gems||{}).every(([k,n])=>(c.gems?.[k]||0)>=n)};}
function perform(c){const v=view(c);if(!v.available)throw Error('Đã đạt giới hạn reset của cấu hình');if(c.level<v.requiredLevel)throw Error('Cần cấp '+v.requiredLevel+' để reset');if(c.gold<v.zen)throw Error('Không đủ Zen');for(const[k,n]of Object.entries(v.gems))if((c.gems?.[k]||0)<n)throw Error('Không đủ ngọc '+k);const base=P.PRESETS[c.classId]?.base;if(!base)throw Error('Hệ nhân vật không hợp lệ');let refunded=0;for(const k of P.FIELDS){const n=(c.attributes?.[k]??base[k])-base[k];if(!Number.isSafeInteger(n)||n<0)throw Error('Chỉ số không hợp lệ');refunded+=n;}const balance=(c.unspentPoints||0)+refunded+v.points;if(!Number.isSafeInteger(balance)||balance<0)throw Error('Điểm không hợp lệ');c.gold-=v.zen;for(const[k,n]of Object.entries(v.gems))c.gems[k]-=n;c.unspentPoints=balance;c.attributes={...base};c.lastResetRefund=refunded;c.resetCount=v.count+1;c.resetRetainedGear=Object.values(c.gear||{}).map(it=>it.id);c.level=0;c.xp=0;c.map=0;return view(c);}
module.exports={view,perform};

/* keep reset items 715 */require('./reset-keep-items.cjs').wrapReset(module.exports);

/* reset balance 82 */require('./reset-balance.cjs').wrap(module.exports,require('./rules/reset.json'));
