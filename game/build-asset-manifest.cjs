'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'public');
if(!fs.existsSync(root))throw new Error('MU public asset directory missing');
const {catalog}=require('./asset-cache.cjs');
const manifest=catalog(root);
const destination=path.join(__dirname,'asset-manifest.prebuilt.json');
const tmp=destination+'.tmp';
fs.writeFileSync(tmp,JSON.stringify(manifest));
fs.renameSync(tmp,destination);
console.log('MU H5 asset manifest generated: '+Object.keys(manifest.files).length+' files');

const rawCommit=String(process.env.RENDER_GIT_COMMIT||process.env.GITHUB_SHA||'').trim();
const hash=/^[0-9a-f]{7,40}$/i.test(rawCommit)?rawCommit.slice(0,8):null;
const builtAt=new Date().toISOString();
const release={version:'2.8',build:hash||builtAt.slice(0,16).replace(/[-:T]/g,''),builtAt};
fs.writeFileSync(path.join(root,'update-info.json'),JSON.stringify(release));
console.log('MU H5 UI build identifier: '+release.build);
