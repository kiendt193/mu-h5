'use strict';
function install(D,SP){
 const migrate=D.migrate;D.migrate=function(c,...args){if(c&&({69:0,70:1,71:3})[c.map]!==undefined)c.map=({69:0,70:1,71:3})[c.map];if(!D.MAPS[c.map]||D.MAPS[c.map].available===false)c.map=0;return migrate.call(this,c,...args);};
 const list=SP.list;SP.list=function(...args){return list.apply(this,args).filter(m=>D.MAPS[m.map]?.available!==false);};
}
module.exports={install};
