'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function createNotice(){
 const notices=[],login={hidden:true},version={textContent:''};
 const document={
  getElementById:id=>id==='login'?login:id==='loginVersion'?version:null,
  createElement:tag=>({tag,style:{},dataset:{},hidden:false,textContent:'',setAttribute(){}}),
  body:{appendChild(node){notices.push(node)}}
 };
 const window={};
 class MutationObserver {constructor(callback){this.callback=callback} observe(){}}
 const source=fs.readFileSync(path.join(__dirname,'public','release-ui.js'),'utf8');
 vm.runInNewContext(source,{
  window,document,MutationObserver,
  localStorage:{getItem:()=> 'vi'},
  fetch:async()=>({ok:false}),
  setInterval:()=>1
 });
 return {api:window.MU_UPDATE_NOTICE,notices,login};
}
test('Character switching and SSE errors never display fake maintenance',()=>{
 const {api,notices,login}=createNotice();
 api.online();api.disconnect();
 assert.equal(notices.length,0,'Temporary SSE disconnect is not server maintenance');
 api.switching();api.shutdown();
 assert.equal(notices.length,0,'An intentional character switch is not maintenance');
 login.hidden=false;api.switchFailed();api.shutdown();
 assert.equal(notices.length,0,'Character roster never displays maintenance');
});
test('Actual update event displays maintenance only while in game',()=>{
 const {api,notices,login}=createNotice();
 api.shutdown();assert.equal(notices.length,1);
 assert.equal(notices[0].dataset.kind,'maintenance');
 api.online();assert.equal(notices[0].hidden,true);
 login.hidden=false;api.shutdown();assert.equal(notices[0].hidden,true);
});
