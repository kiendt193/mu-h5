'use strict';
// Incremental, bounded channel history. Rebuild only on channel/language changes.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MU_CHAT_UI121=factory();})(typeof window==='undefined'?globalThis:window,function(){
 function create({document,log,tabs,t=s=>s,notify=()=>{},onUnread=()=>{},limit=100}){
  let channel='nearby',visible=false;const logs={nearby:[],world:[]},unread={nearby:0,world:0};
  const buttons=Array.from(tabs.querySelectorAll('button'));
  const content=r=>r.kind120?r.name+' '+t(r.kind120==='craft'?'ghép thành công':'cường hóa thành công')+' '+t(r.item)+' +'+r.level:(r.system?t('Hệ thống'):r.name)+': '+(r.system?t(r.text):r.text);
  function line(r){const p=document.createElement('p');p.dataset.i18nSkip='';if(r.system)p.className='system worldNotice120';p.textContent=content(r);return p;}
  function labels(){for(const b of buttons){const ch=b.dataset.channel120,n=unread[ch];b.dataset.i18nSkip='';b.textContent=t(ch==='nearby'?'Lân cận':'Thế giới')+(n?' ('+(n>99?'99+':n)+')':'');b.classList.toggle('selected',ch===channel);b.setAttribute('aria-pressed',String(ch===channel));}onUnread({...unread});}
  function bottom(){return !log||log.scrollHeight-log.scrollTop-log.clientHeight<32;}
  function render(){if(log){const fragment=document.createDocumentFragment();for(const r of logs[channel])fragment.appendChild(line(r));log.replaceChildren(fragment);log.scrollTop=log.scrollHeight;}labels();}
  function select(ch){if(!Object.hasOwn(logs,ch))return;channel=ch;if(visible)unread[ch]=0;render();}
  for(const b of buttons)b.onclick=()=>select(b.dataset.channel120);
  function receive(r){const ch=r.channel||(r.system?'world':'nearby');if(!Object.hasOwn(logs,ch))return;const following=bottom();logs[ch].push({...r});if(logs[ch].length>limit)logs[ch].shift();if(ch===channel&&log){const top=log.scrollTop;log.appendChild(line(r));const appendedHeight=log.scrollHeight;while(log.children.length>limit)log.firstChild.remove();if(visible&&following){log.scrollTop=log.scrollHeight;unread[ch]=0;}else{log.scrollTop=Math.max(0,top-Math.max(0,appendedHeight-log.scrollHeight));unread[ch]=Math.min(999,unread[ch]+1);}}else unread[ch]=Math.min(999,unread[ch]+1);labels();if(ch==='world'&&r.system&&(!visible||channel!=='world'))notify(content(r));}
  log?.addEventListener('scroll',()=>{if(visible&&bottom()&&unread[channel]){unread[channel]=0;labels();}});
  render();
  return {receive,select,retranslate:render,clear(ch){if(!Object.hasOwn(logs,ch))return;logs[ch].length=0;unread[ch]=0;if(ch===channel)render();else labels();},reset(){for(const ch of Object.keys(logs)){logs[ch].length=0;unread[ch]=0;}render();},setVisible(value){visible=!!value;if(visible&&bottom()){unread[channel]=0;labels();}},get channel(){return channel;},get counts(){return {...unread};}};
 }
 return {create};
});
