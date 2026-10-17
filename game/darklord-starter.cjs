'use strict';
const crypto=require('node:crypto');
function grant(c){
 if(c.classId!=='darklord')return;
 const pet=require('./pets.cjs').make('raven');
 const rule=require('./equipment-config.cjs').TABLE['13:4'];
 if(!rule)throw Error('Thiếu cấu hình Chiến Mã 13:4');
 const horse={...rule,id:crypto.randomUUID(),kind:'gear',slot:'mount',classId:'darklord',name:'Chiến Mã · Dark Horse',icon:'icons/item-darkhorsehorn.webp',mount:'darkhorse',mountModel:'dark-horse',power:0,defense:0,price:1000,enhance:0,rarity:'normal',excellent:[]};
 c.inventory.push(horse,pet);
}
module.exports={grant};
