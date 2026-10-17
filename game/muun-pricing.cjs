'use strict';
const weights={hp:1/100,mp:1/100,damage:5,speed:5,double:20,triple:30,exp:1,resistDouble:10,resistDefenseIgnore:10,resistSDIgnore:10,resistCritical:10,resistExcellent:10,reflect:15};
function score(row){const s=row.sourceStats||{};return Object.entries(weights).reduce((sum,[key,w])=>{const value=Number(s[key]);return sum+(Number.isFinite(value)?Math.max(0,value)*(key==='hp'||key==='mp'?1/80:1)*w:0);},0);}
function valid(row){return !row.missingOption&&score(row)>0;}
function configure(rows){const live=rows.filter(r=>r.profile==='muun'&&valid(r));const min=Math.min(...live.map(score));for(const r of live){r.price=Math.max(500,Math.ceil(500*score(r)/min/50)*50);r.currency='phucDuyen';}for(let i=rows.length-1;i>=0;i--)if(rows[i].profile==='muun'&&!valid(rows[i]))rows.splice(i,1);return rows;}
module.exports={score,valid,configure};
