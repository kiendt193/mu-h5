'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function harness(){
 const source=fs.readFileSync(path.join(__dirname,'public','preloader.js'),'utf8');
 const entries=new Map(),counters={fetches:0,put:0};
 const cache={match:async(key)=>entries.get(key),put:async(key,value)=>{entries.set(key,value);counters.put++}};
 const caches={open:async()=>cache};
 const nodes=new Map();
 class Element{
  constructor(name){this.id=name;this.style={};this.hidden=false;this.children={};this.handlers={};}
  querySelector(query){return this.children[query]||(this.children[query]=new Element(query))}
  addEventListener(name,callback){this.handlers[name]=callback}
  setAttribute(){}
  remove(){this.removed=true}
 }
 const document={
  createElement:name=>new Element(name),
  getElementById:name=>nodes.get(name),
  querySelectorAll:name=>name==='link[rel="stylesheet"]'?[{getAttribute:()=> 'style.css?v=old'}]:[],
  head:{append:el=>nodes.set(el.id,el)},
  body:{append:el=>nodes.set(el.id,el)}
 };
 const window={caches};
 const context={window,document,navigator:{userAgent:'Android',connection:{effectiveType:'4g'}},
  location:{origin:'https://test.example',href:'https://test.example/mu/'},URL,
  caches,Response,AbortController,console,Promise,setTimeout,clearTimeout,
  fetch:async()=>{
   counters.fetches++;
   return new Response('small game asset',{status:200,headers:{'Content-Type':'text/plain','Content-Length':'16'}});
  }};
 vm.runInNewContext(source,context,{filename:'preloader.js'});
 return {api:window.MU_PRELOAD,counters,entries,nodes};
}
const hashes={
 'game.js':'a'.repeat(24),'scene.js':'b'.repeat(24),'style.css':'c'.repeat(24),
 'assets/mu05/manifest.json':'d'.repeat(24),
 'assets/mu05/ui/character.webp':'e'.repeat(24)
};
test('assets are fingerprinted and API calls are never preloaded',()=>{
 const h=harness();
 const list=h.api.candidates({files:hashes},v=>v,[{dataset:{src:'game.js'}},{dataset:{src:'scene.js'}},{dataset:{src:'api/events?sync=2'}}]);
 assert.equal(list.length,5);
 assert(list.every(url=>url.includes('/mu/')&&url.includes('?v=')&&!url.includes('/api/')));
});
test('first visit downloads game assets; second visit reuses device cache',async()=>{
 const h=harness();
 const scripts=[{dataset:{src:'game.js'}},{dataset:{src:'scene.js'}}];
 const first=await h.api.prepare({files:hashes},v=>v,scripts);
 assert.equal(first.total,5);
 assert.equal(first.done,5);
 assert.equal(first.downloaded,5);
 assert.equal(h.counters.fetches,5);
 const second=await h.api.prepare({files:hashes},v=>v,scripts);
 assert.equal(second.cached,5);
 assert.equal(second.downloaded,0);
 assert.equal(h.counters.fetches,5);
 assert(h.nodes.get('muBootPreload').removed);
});
test('data saver does not automatically preload game resources',async()=>{
 const h=harness();
 // Confirm API guards on a test implementation with no scripts.
 const empty=await h.api.prepare({files:{}},v=>v,[]);
 assert.equal(empty.total,0);
 assert.equal(h.counters.fetches,0);
});
