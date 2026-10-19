'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('./economy-d.cjs');
const character=()=>({
 gold:15000000,gems:{bless:100,soul:100,chaos:100,life:100,creation:100},
 inventory:[
 {id:'weapon',kind:'gear',slot:'weapon',name:'Test Sword',enhance:0},
 {id:'wing',kind:'gear',slot:'wing',name:'Test Wing',enhance:0},
 {id:'mount',kind:'gear',slot:'mount',name:'Test Mount',enhance:0},
 {id:'pet',kind:'pet',slot:'pet',name:'Test Pet',value:5,maxHp:100,hp:20,remainingMs:10000}
 ],gear:{},petConfig:{enabled:true}
});
test('socket gem is consumed once; bonuses are persisted',()=>{
 const c=character(),zen=c.gold,soul=c.gems.soul;
 const r=D.act(c,{kind:'socketD',id:'weapon',gem:'soul'});
 assert.equal(r.success,true);assert.equal(c.gold,zen-r.cost);
 assert.equal(c.gems.soul,soul-1);assert.deepEqual(c.inventory[0].socketsD,['soul']);
 assert.equal(c.inventory[0].dOptions[0].id,'flatDamage');
});
test('invalid socket type and insufficient Zen cause no mutation',()=>{
 const c=character();let before=structuredClone(c);
 assert.throws(()=>D.act(c,{kind:'socketD',id:'weapon',gem:'unsafe'}));
 assert.deepEqual(c,before);
 c.gold=1;before=structuredClone(c);
 assert.throws(()=>D.act(c,{kind:'reforgeD',id:'weapon'}));
 assert.deepEqual(c,before);
});
test('socket limit cannot be bypassed',()=>{
 const c=character();
 for(let i=0;i<3;i++)D.act(c,{kind:'socketD',id:'weapon',gem:'soul'});
 const before=structuredClone(c);
 assert.throws(()=>D.act(c,{kind:'socketD',id:'weapon',gem:'soul'}));
 assert.deepEqual(c,before);
});
test('tiers progress to 3 and stop without losing items',()=>{
 const c=character();
 for(let i=0;i<3;i++)D.act(c,{kind:'reforgeD',id:'weapon'});
 assert.equal(c.inventory[0].economyTierD,3);
 assert.equal(c.inventory.length,4);
 const before=structuredClone(c);
 assert.throws(()=>D.act(c,{kind:'reforgeD',id:'weapon'}));
 assert.deepEqual(c,before);
});
test('wing and mount training consume items and apply stat options',()=>{
 const c=character();
 D.act(c,{kind:'trainD',id:'wing'});D.act(c,{kind:'trainD',id:'mount'});
 assert.equal(c.inventory[1].companionRankD,1);
 assert.equal(c.inventory[2].companionRankD,1);
 assert.equal(c.inventory[1].dOptions[0].id,'damage');
 assert.equal(c.inventory[2].dOptions[0].id,'defense');
});
test('pet training improves bonus and extends use duration',()=>{
 const c=character();
 D.act(c,{kind:'trainD',id:'pet'});
 const p=c.inventory[3];assert.equal(p.trainingLevelD,1);
 assert.equal(p.value,6);assert(p.remainingMs>=7200000);assert.equal(p.hp,100);
});
test('pet care restores HP and duration, but full pet is not charged',()=>{
 const c=character(),p=c.inventory[3];
 D.act(c,{kind:'feedD',id:'pet'});assert.equal(p.hp,p.maxHp);
 assert(p.remainingMs>1000000);
 p.remainingMs=2000000;
 const before=structuredClone(c);
 assert.throws(()=>D.act(c,{kind:'feedD',id:'pet'}));
 assert.deepEqual(c,before);
});
test('gem fusion consumes deterministic ingredients and Zen',()=>{
 const c=character();D.act(c,{kind:'jewelFusion'});
 assert.equal(c.gems.bless,95);assert.equal(c.gems.soul,95);
 assert.equal(c.gems.chaos,99);assert.equal(c.gems.life,101);
 assert.equal(c.gold,14900000);
});
test('unknown item and malicious kind rejected without charges',()=>{
 const c=character(),before=structuredClone(c);
 assert.throws(()=>D.act(c,{kind:'trainD',id:'other'}));
 assert.throws(()=>D.act(c,{kind:'arbitrary',id:'weapon'}));
 assert.deepEqual(c,before);
});
test('trained Raven boosts server attack stat only when enabled',()=>{
 const PET={options:()=>[]};D.install({},PET);
 const c=character();c.gear.shield={kind:'pet',pet:'raven',trainingLevelD:4};
 assert.equal(PET.options(c)[0].value,12);
 c.petConfig.enabled=false;assert.equal(PET.options(c).length,0);
});
