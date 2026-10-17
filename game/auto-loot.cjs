'use strict';
// White/ordinary equipment is manual pickup only. Books, jewels and materials keep their existing rules.
module.exports=function autoPickupAllowed(item){return !!item&&(item.kind!=='gear'||item.rarity==='excellent'||(Array.isArray(item.excellent)&&item.excellent.length>0));};
