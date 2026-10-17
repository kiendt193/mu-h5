'use strict';
const crypto=require('node:crypto');
const SPECS=['wizard','knight','elf','gladiator','darklord','summoner','fighter'].map((classId,i)=>({classId,appearance:'item-wing'+(401+i),definitionId:'12:'+(156+i),name:'Cánh SS13 · '+({wizard:'Pháp sư',knight:'Chiến binh',elf:'Tiên nữ',gladiator:'Đấu sĩ',darklord:'Chúa tể',summoner:'Thuật sĩ',fighter:'Thiết binh'}[classId])}));
function install(S,E,manifest,ready=()=>true){
 const custom=SPECS.filter(s=>{const m=manifest.models[s.appearance];return m?.animation&&m.meshes?.length&&ready(m,s);});
 for(const s of custom)E.TABLE[s.definitionId]={name:s.name,sourceName:s.name,classes:[s.classId],classStages:{[s.classId]:3},sourceSlot:7,requiredLevel:400,requirements:{strength:0,dexterity:0,vitality:0,energy:0,leadership:0},drop:false};
 const output=s=>({id:crypto.randomUUID(),kind:'gear',slot:'wing',...s,classes:[s.classId],classStages:{[s.classId]:3},requiredLevel:400,requirements:{},wingTier:4,power:140,defense:70,price:140000,enhance:0,rarity:'normal',excellent:[],drop:false,craftOnly120:true,icon:'icons/'+s.appearance+'.webp'});
 const originalRecipes=S.recipes.bind(S),originalCraft=S.craft.bind(S),previewCache=new Map(),customRecipeCache=new Map();
 function recipe(c){if(customRecipeCache.has(c.classId))return customRecipeCache.get(c.classId);const s=custom.find(s=>s.classId===c.classId);const value=s?require('./balance131.cjs').wing({id:'ss13-'+s.classId,name:s.name,rate:35,gold:20000000,gems:{bless:20,soul:20,life:10,chaos:5,creation:3},materials:{condorfeather:5,condorflame:5},consume:{slot:'wing',tier:3,enhance:9},level:400,stage:3,preview:{...output(s),id:'preview-ss13-'+s.classId},custom120:true}):null;customRecipeCache.set(c.classId,value);return value;}
 S.recipes=function(c){return [...originalRecipes(c).map(r=>{const key=c.classId+':'+r.id;let preview=previewCache.get(key);if(!previewCache.has(key)){try{preview=r.material?null:r.mount?S.mount(r.mount):S.wing(c.classId,r.tier);if(preview)preview.id='preview-'+key;}catch{}previewCache.set(key,preview);}return {...r,preview};}),...[recipe(c)].filter(Boolean)];};
 S.craft=function(c,id,itemId,rng=Math.random){
  if(typeof id!=='string')throw Error('Công thức không hợp lệ với hệ');if(!id.startsWith('ss13-')){const ids=new Set(c.inventory.map(i=>i.id));const result=originalCraft(c,id,itemId,rng);return {...result,item:c.inventory.find(i=>!ids.has(i.id))||null};}
  S.init(c);const r=recipe(c);if(!r||r.id!==id)throw Error('Công thức không hợp lệ với hệ');if(c.level<r.level)throw Error('Cần cấp '+r.level);if((c.classStage||1)<r.stage)throw Error('Cần chuyển chức cấp 3');
  const it=c.inventory.find(i=>i.id===itemId&&i.slot==='wing'&&i.wingTier===3&&(i.enhance||0)>=9&&i.classes?.includes(c.classId));if(!it)throw Error('Chọn cánh cấp 3 +9 trở lên đúng hệ trong túi');
  if(c.gold<r.gold)throw Error('Không đủ Zen');for(const[k,n]of Object.entries(r.gems))if((c.gems[k]||0)<n)throw Error('Thiếu ngọc '+k);for(const[k,n]of Object.entries(r.materials))if((c.materials[k]||0)<n)throw Error('Thiếu '+S.MATERIALS[k]);if(c.inventory.length-1>=40)throw Error('Túi đồ đã đầy');
  const item=output(custom.find(s=>s.classId===c.classId));E.sync(item);const success=rng()*100<r.rate;c.gold-=r.gold;for(const[k,n]of Object.entries(r.gems))c.gems[k]-=n;for(const[k,n]of Object.entries(r.materials))c.materials[k]-=n;c.inventory.splice(c.inventory.indexOf(it),1);if(success)c.inventory.push(item);return{success,rate:r.rate,name:r.name,item:success?item:null};
 };
 return custom;
}
function createChat({streams,players,same=()=>true,clock=()=>Date.now()}){
 function send(packet,p){let count=0;const wire='event: chat\ndata: '+JSON.stringify(packet)+'\n\n';for(const[id,stream]of streams){const q=players.get(id);if(!q||q.isAI||stream.destroyed||stream.writableLength>32768)continue;if(packet.channel==='nearby'&&(!p||q.user.character.map!==p.user.character.map||!same(p,q)))continue;stream.write(wire);count++;}return count;}
 return{send,player(p,text,channel){channel=channel==='world'?'world':'nearby';if(channel==='nearby')p.bubble={text,until:clock()+7000};return send({name:p.user.character.name,text,channel,map:p.user.character.map},p);},craft(p,result){if(result.success&&result.item)send({name:p.user.character.name,system:true,channel:'world',kind120:'craft',item:result.item.name,level:result.item.enhance||0});},enhance(p,item,result){if(result.success&&result.level>=10&&item)send({name:p.user.character.name,system:true,channel:'world',kind120:'enhance',item:item.name,level:result.level});}};
}
module.exports={SPECS,install,createChat};
