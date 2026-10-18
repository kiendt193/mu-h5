'use strict';
/** Expand the browser-ready MU Skill.zip conversion pack during Render build.
 * Run before hashing static assets. No third-party dependencies.
 * Archive layout: manifest.json, model-index.json, textures/, models/, smd/.
 */
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
function install(){
 const zip=path.join(__dirname,'skill-full-assets.zip');
 if(!fs.existsSync(zip)){console.log('MU skill-full pack is not installed yet; native FX fallback remains active');return false;}
 const data=fs.readFileSync(zip),out=path.join(__dirname,'public','assets','skill-full');
 if(data.length>32*1024*1024)throw Error('Skill pack too large');
 let eocd=-1;
 for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(data.readUInt32LE(i)===0x06054b50){eocd=i;break;}
 if(eocd<0)throw Error('Invalid ZIP directory');
 const entries=data.readUInt16LE(eocd+10),cd=data.readUInt32LE(eocd+16);
 if(entries<500||entries>850)throw Error('Unexpected MU skill asset count: '+entries);
 let offset=cd,total=0;
 fs.mkdirSync(out,{recursive:true});
 for(let j=0;j<entries;j++){
  if(data.readUInt32LE(offset)!==0x02014b50)throw Error('ZIP directory corrupt at '+j);
  const method=data.readUInt16LE(offset+10),len=data.readUInt32LE(offset+24),compressed=data.readUInt32LE(offset+20);
  const nameLength=data.readUInt16LE(offset+28),extraLength=data.readUInt16LE(offset+30),comment=data.readUInt16LE(offset+32);
  const file=data.subarray(offset+46,offset+46+nameLength).toString('utf8');
  const local=data.readUInt32LE(offset+42);
  offset+=46+nameLength+extraLength+comment;
  if(file.endsWith('/'))continue;
  if(file.includes('\\')||file.startsWith('/')||file.split('/').includes('..')||!/^([a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+$/.test(file))throw Error('Invalid skill file path '+file);
  if(!['manifest.json','model-index.json'].includes(file)&&!file.startsWith('models/')&&!file.startsWith('textures/')&&!file.startsWith('smd/'))throw Error('Unexpected skill file '+file);
  if(data.readUInt32LE(local)!==0x04034b50)throw Error('ZIP local header invalid');
  const start=local+30+data.readUInt16LE(local+26)+data.readUInt16LE(local+28);
  const bytes=data.subarray(start,start+compressed);
  const decoded=method===8?zlib.inflateRawSync(bytes):method===0?bytes:(()=>{throw Error('Unsupported ZIP compression')})();
  if(decoded.length!==len)throw Error('Invalid skill asset size '+file);
  const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,decoded);
  total++;
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
 if(manifest.entries!==374||manifest.summary?.converted!==372)throw Error('MU skill conversion manifest fails audit');
 console.log('Original MU Skill assets installed: '+manifest.summary.converted+' files, '+total+' browser files');
 return true;
}
module.exports=install;
if(require.main===module)install();
