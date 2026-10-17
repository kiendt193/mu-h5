'use strict';
const resource=d=>['gem','material'].includes(d?.item?.kind);
function eligible(p,c,d,now){return d&&d.map===c.map&&resource(d)&&d.expires>now&&(d.owner===c.id||now>=d.publicAt)&&!(p.navBlocked?.[d.id]>now);}
function select(p,c,drops,now){if(!p.auto||!c.autoConfig.pickup){p.resourceFocus=null;return null;}const previous=drops.get(p.resourceFocus);if(now<(p.resourceFocusUntil||0)&&eligible(p,c,previous,now)&&Math.hypot(p.x-previous.x,p.y-previous.y)>85&&Math.hypot(p.x-previous.x,p.y-previous.y)<=450)return previous;let target=null,best=450;for(const d of drops.near(c.map,p.x,p.y,450)){if(!eligible(p,c,d,now))continue;const gap=Math.hypot(p.x-d.x,p.y-d.y);if(gap>85&&gap<best){target=d;best=gap;}}p.resourceFocus=target?.id||null;p.resourceFocusUntil=now+3500;return target;}
module.exports={resource,eligible,select};
