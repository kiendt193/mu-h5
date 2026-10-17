'use strict';
function wing(r){if(!r.custom120)return r;const half=obj=>Object.fromEntries(Object.entries(obj||{}).map(([k,n])=>[k,Math.max(1,Math.ceil(n/2))]));return{...r,gold:2000000,rate:Math.min(100,r.rate+15),gems:half(r.gems),materials:half(r.materials)};}
module.exports={wing};

/* wingGold134 */
