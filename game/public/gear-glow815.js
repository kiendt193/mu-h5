'use strict';
const MU_GEAR_GLOW815={
 rarity(it){return it?.rarity==='ancient'||it?.ancient?2:it?.rarity==='excellent'?1:0;},
 profile(it){const level=Math.max(0,Math.min(15,Number(it?.enhance)||0)),rarity=this.rarity(it);const brightness=level>=15?1.34:level>=13?1.22:level>=9?1.12:level>=7?.98:level>=6?.76:1;const tint=[brightness,brightness,brightness];if(rarity===1){tint[1]*=1.12;tint[2]*=1.04;}if(rarity===2){tint[0]*=1.07;tint[2]*=1.16;}const glow=(level>=15?1.2:level>=13?.86:level>=9?.48:level>=7?.12:0)+(rarity===2?.3:rarity===1?.2:0);return{level,rarity,tint,glow};}
};
liveGearTint=it=>MU_GEAR_GLOW815.profile(it).tint;
liveGearGlow=it=>MU_GEAR_GLOW815.profile(it).glow;
if(typeof module!=='undefined')module.exports=MU_GEAR_GLOW815;
