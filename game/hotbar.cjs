'use strict';
function configure(c,b,skills){if(!Array.isArray(b.skills)||b.skills.length!==4||b.skills.some(id=>id!==null&&(typeof id!=='string'||!c.skills.includes(id)||!skills.some(s=>s.id===id&&(!s.support||s.support==='summon'))))||new Set(b.skills.filter(Boolean)).size!==b.skills.filter(Boolean).length)throw Error('Chọn tối đa 4 kỹ năng tấn công đã học, không trùng');if(b.buff!==null&&(!c.skills.includes(b.buff)||!skills.some(s=>s.id===b.buff&&s.support)))throw Error('Kỹ năng hỗ trợ không hợp lệ');c.hotbar={skills:[...b.skills],buff:b.buff};}
function rotation(c,skills,allowed,mp){const ids=c.hotbar?.skills.filter(Boolean)||[c.activeSkill];return ids.map(id=>skills.find(s=>s.id===id&&c.skills.includes(id))).filter(s=>s&&!s.support&&allowed(c,s)&&mp>=s.mana);}
function next(c,p,skills,allowed){const list=rotation(c,skills,allowed,p.mp);return list.length?list[(p.rotationIndex||0)%list.length]:null;}
module.exports={configure,rotation,next};
