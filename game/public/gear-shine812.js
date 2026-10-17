'use strict';
const MU_GEAR_SHINE812={
 profile(it){const level=Math.max(0,Math.min(15,Number(it?.enhance)||0));const brightness=level>=15?1.15:level>=13?1.1:level>=9?1.02:level>=7?.92:level>=6?.76:1;const glow=level>=15?.72:level>=13?.5:level>=9?.28:level>=7?.08:0;const tint=[brightness,brightness,brightness];if(it?.rarity==='excellent'){tint[1]*=1.04;tint[2]*=1.02;}if(it?.rarity==='ancient'){tint[0]*=1.03;tint[2]*=1.06;}return{level,tint,glow};}
};
// Loaded after existing quality/EX/Ancient wrappers. Enhancement remains visible in Low mode.
liveGearTint=it=>MU_GEAR_SHINE812.profile(it).tint;
liveGearGlow=it=>MU_GEAR_SHINE812.profile(it).glow;
