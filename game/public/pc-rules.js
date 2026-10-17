'use strict';
const MU_PC_RULES={
 gate(state,sk){const c=state.character,s=state.stats,reasons=[];
  if((c.classStage||1)<(sk.requiredStage||1))reasons.push('Cần chuyển chức '+Math.max(0,(sk.requiredStage||1)-1)+' lần');
  if(!c.skills.includes(sk.id))reasons.push('Chưa học sách / ngọc kỹ năng');
  if(c.level<sk.level)reasons.push('Cần cấp '+sk.level);
  if((c.attributes?.energy||0)<(sk.requiredEnergy||0))reasons.push('Cần Năng lượng '+sk.requiredEnergy);
  if((c.attributes?.leadership||0)<(sk.requiredLeadership||0))reasons.push('Cần Mệnh lệnh '+sk.requiredLeadership);
  if(sk.weaponTypes?.length&&!sk.weaponTypes.includes(s.weaponType))reasons.push('Vũ khí không phù hợp: '+sk.weaponTypes.join(' / '));
  return reasons;
 },
 cooldown(at,duration,now){const length=Math.max(1,Number(duration)||1),ms=Math.max(0,Number(at)+length-Number(now));return{ms,cut:100-Math.min(100,ms/length*100),text:ms>=1000?(ms/1000).toFixed(1):ms>0?'0.'+Math.max(1,Math.ceil(ms/100)):''};}
};
if(typeof module!=='undefined')module.exports=MU_PC_RULES;
