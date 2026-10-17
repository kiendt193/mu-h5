'use strict';
function apply(skills){for(const list of Object.values(skills))for(const skill of list){if(!Number.isFinite(skill.cooldown)||skill.cooldown<=0)continue;if(!Object.hasOwn(skill,'originalCooldown'))skill.originalCooldown=skill.cooldown;skill.cooldown=Math.round(skill.originalCooldown*.2);}return skills;}
module.exports={apply};
