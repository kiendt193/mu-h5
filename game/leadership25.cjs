'use strict';
function install(E,P){let fixed=0;for(const r of Object.values(E.TABLE)){if(r.requirements?.leadership>0&&!r.classes?.includes('darklord')){r.requirements={...r.requirements,leadership:0};fixed++;}}const old=P.missing;P.missing=function(c,it){if(c.classId==='darklord')return old.call(this,c,it);const safe={...it,requirements:{...(it.requirements||{}),leadership:0}};return old.call(this,c,safe);};return fixed;}
module.exports={install};
