'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Singapore Render is locked by default before Neon and the game loop start',()=>{
 const s=fs.readFileSync(path.join(__dirname,'server.cjs'),'utf8');
 const start=s.indexOf("if(require.main===module){(async()=>{");
 const lock=s.indexOf("process.env.RENDER_SERVICE_ID==='srv-db9gfovbtjjs73bl68t0'",start);
 const database=s.indexOf("require('./storage-postgres.cjs').connect",start);
 const create=s.indexOf("const game=createGame({initialDb,dataStore})",start);
 assert(start>=0&&lock>start);
 assert(database>lock&&create>database);
 assert.match(s.slice(lock,database),/process\.env\.MU_RENDER_ALLOW_START!=='1'/);
 assert.match(s.slice(lock,database),/return;/);
 assert.match(s.slice(lock,database),/503/);
 assert.match(s.slice(lock,database),/reason:'render-manual-lock'/);
});
test('Lock condition allows VPS and requires explicit opt-in for Singapore Render',()=>{
 const shouldLock=env=>env.RENDER_SERVICE_ID==='srv-db9gfovbtjjs73bl68t0'
  &&env.MU_RENDER_ALLOW_START!=='1';
 assert.equal(shouldLock({}),false);
 assert.equal(shouldLock({RENDER_SERVICE_ID:'srv-db9gfovbtjjs73bl68t0'}),true);
 assert.equal(shouldLock({RENDER_SERVICE_ID:'srv-db9gfovbtjjs73bl68t0',MU_RENDER_ALLOW_START:'0'}),true);
 assert.equal(shouldLock({RENDER_SERVICE_ID:'srv-db9gfovbtjjs73bl68t0',MU_RENDER_ALLOW_START:'1'}),false);
 assert.equal(shouldLock({RENDER_SERVICE_ID:'different-service'}),false);
});
