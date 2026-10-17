'use strict';
const MU_LANGUAGE_CORE=(function(){
 const languages={vi:{name:'Tiếng Việt',locale:'vi-VN'},en:{name:'English',locale:'en-US'},zh:{name:'中文',locale:'zh-CN'},id:{name:'Bahasa Indonesia',locale:'id-ID'},th:{name:'ไทย',locale:'th-TH'}},indices={en:0,zh:1,id:2,th:3};
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),keys=Object.keys(MU_LANG_DATA).sort((a,b)=>b.length-a.length),lower=new Map(keys.map(k=>[k.toLocaleLowerCase('vi'),k]));
 const matcher=new RegExp('(?<![\\p{L}_])(?:'+keys.map(k=>esc(k).replace(/\s+/g,'\\s+')).join('|')+')(?![\\p{L}_])','giu');
 function translate(text,lang='vi',protectedText=[]){
  if(typeof text!=='string'||lang==='vi'||indices[lang]===undefined||!text)return text;
  let input=text.normalize('NFC');const protectedValues=[];
  for(const value of [...new Set(protectedText.filter(v=>typeof v==='string'&&v))].sort((a,b)=>b.length-a.length))if(input.includes(value)){const token='\uE000'+protectedValues.length+'\uE001';protectedValues.push(value);input=input.split(value).join(token);}
  const out=input.replace(matcher,match=>{const clean=match.replace(/\s+/g,' '),key=Object.hasOwn(MU_LANG_DATA,clean)?clean:lower.get(clean.toLocaleLowerCase('vi'));return key?MU_LANG_DATA[key][indices[lang]]:match;});
  return out.replace(/\uE000(\d+)\uE001/g,(_,n)=>protectedValues[Number(n)]??'');
 }
 return {languages,translate};
})();
if(typeof module!=='undefined')module.exports=MU_LANGUAGE_CORE;
