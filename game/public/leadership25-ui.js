'use strict';
(()=>{const prior=requirementText;requirementText=function(it,...args){if(state?.character?.classId&&state.character.classId!=='darklord')it={...it,requirements:{...(it.requirements||{}),leadership:0}};return prior(it,...args);};})();
