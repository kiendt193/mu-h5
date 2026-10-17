'use strict';
// A stale actor packet must not make the entire avatar disappear while the server reloads.
(function(){if(typeof liveParts!=='function')return;const previous=liveParts;liveParts=function(p){const manifest=MU_LIVE.manifest;if(!manifest)return previous(p);const gear={...p.gear};for(const slot of ['helm','armor','pant','glove','boot','weapon','shield']){const it=gear[slot],key=it?.appearance||it?.key;if(key&&(key==='player-helmmale102_mage'||!manifest.models[key]))delete gear[slot];}return previous({...p,gear});};})();
