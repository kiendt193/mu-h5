'use strict';
const fs=require('fs'),path=require('path'),E=require('./equipment-config.cjs'),R=require('./combat-rules.cjs'),source=require('./source-rules1227.json');
const ARMOR=new Set(['helm','armor','pant','glove','boot']);
function effect(s){const n=s.name.toLowerCase();const known={40:'inferno',41:'spin',56:'powerslash',260:'slash',261:'uppercut',262:'slash',263:'spirit',264:'breath',265:'slash',270:'fire'};if(known[s.id])return known[s.id];return /ice|frozen/.test(n)?'ice':/lightning|electric|thunder/.test(n)?'lightning':/poison/.test(n)?'poison':/spirit|drain/.test(n)?'spirit':/meteor/.test(n)?'meteor':/fire|flame|dragon/.test(n)?'fire':/arrow|shot|bow|penetration/.test(n)?'arrow':/twist|cyclone|spin/.test(n)?'spin':/earth|rage|blow/.test(n)?'quake':/aqua|power wave/.test(n)?'aqua':'slash';}
function install(D){
 const definitions=require('./public/assets/mu03/source-items.json'),canonical=require('./public/assets/mu03/item-names124.json'),byId=new Map(definitions.filter(x=>x.definitionId&&x.icon&&fs.existsSync(path.join(__dirname,'public/assets/mu03',x.icon))).map(x=>[x.definitionId,x]));
 const rules=JSON.parse(fs.readFileSync(path.join(__dirname,'rules/equipment.json'),'utf8'));for(const [id,r]of Object.entries(rules))if(r.sourceGroup<=11){E.TABLE[id].classes=[...r.classes];E.TABLE[id].classStages={...r.classStages};if(R.TABLE[id])R.TABLE[id].classes=[...r.classes];}
 function sync(it){if(!it)return;it.definitionId ||=canonical.visual?.[it.appearance||it.key];if(it.kind==='gear')E.sync(it);const native=byId.get(it.definitionId);if(native)it.icon=native.icon;const r=R.rule(it);if(r){it.weaponType=r.type;it.twoHand=r.twoHand;it.bothHands=r.bothHands;}}
 function invalid(it){return it?.kind==='gear'&&ARMOR.has(it.slot)&&(!E.rule(it)||!E.rule(it).classes.length);}
 for(let i=D.catalog.length-1;i>=0;i--){sync(D.catalog[i]);if(invalid(D.catalog[i]))D.catalog.splice(i,1);}
 // Always resync before suitability checks: old inventory metadata must not override Item.txt.
 const allowed=E.allowed;E.allowed=function(c,it){sync(it);return !invalid(it)&&allowed(c,it);};
 for(const cls of source.classes){const list=D.SKILLS[cls],types=R.ALLOWED[cls];for(const s of source.skills){if(!s.classes[cls]||list.some(x=>x.sourceId===s.id))continue;const fx=effect(s),id='native'+s.id+'_'+cls;list.push({id,sourceId:s.id,name:s.vietnameseName,sourceName:s.name,level:Math.max(1,s.level),requiredStage:s.classes[cls],sourceClassStage:s.classes[cls],requiredEnergy:s.energy,requiredLeadership:s.leadership,mana:s.mana,sourceDamage:s.damage,mult:Math.max(1.2,Math.min(4,1+s.damage/100)),range:Math.max(32,s.range*32,s.radius*32),area:s.radius*32,sourceRange:s.range,sourceRadius:s.radius,cooldown:Math.max(1800,s.delay),effect:fx,weaponTypes:cls==='gladiator'&&['fire','ice','lightning','poison','meteor','aqua','spirit'].includes(fx)?['staff']:types,icon:'../skill-icons/'+id+'.png',illustration:'../skill-icons/'+id+'.png',targetType:s.range?'target':'self',description:s.vietnameseName+' · '+(s.radius?'Tấn công trong vùng.':'Tấn công mục tiêu.')});}}
 function clean(c){for(const key of ['inventory','warehouse','gearRecovery'])if(Array.isArray(c[key]))c[key]=c[key].filter(it=>{sync(it);return !invalid(it);});for(const [slot,it]of Object.entries(c.gear||{})){sync(it);if(invalid(it))delete c.gear[slot];}c.equipment=c.gear?.weapon||null;}
 const migrate=D.migrate;D.migrate=function(c,...args){clean(c);const result=migrate(c,...args);clean(c);return result;};
 const drop=D.makeDrop;D.makeDrop=function(...args){const it=drop(...args);sync(it);return invalid(it)?null:it;};
 return {sync,clean,invalid};
}
module.exports={install,effect};
