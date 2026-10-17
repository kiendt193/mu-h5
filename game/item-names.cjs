'use strict';
const classes={DK:'Chiến binh',DW:'Pháp sư',DL:'Chúa tể',MG:'Đấu sĩ',EF:'Tiên nữ',Elf:'Tiên nữ',RF:'Thiết binh',SM:'Thuật sĩ',SUM:'Thuật sĩ'};
function name(it){let n=String(it.name||'');n=n.replace(/\b(DK|DW|DL|MG|EF|Elf|RF|SM|SUM)\b/g,k=>classes[k]).replace(/\bGiầy\b/g,'Giày').replace(/\bQ\.\s*/g,'Quần ').replace(/\bG\.\s*/g,it.slot==='boot'?'Giày ':'Găng ').replace(/\bTr\.\s*/g,'Trượng ');
if(/^(Helm|Armor|Pant|Glove|Boot)(Male|Elf|Class)?\d*$/i.test(n)){const slot={helm:'Mũ',armor:'Áo giáp',pant:'Quần',glove:'Găng tay',boot:'Giày'}[it.slot]||'Trang bị';const family=/Elf/i.test(n)?'Tiên nữ':(classes[it.classId]||({wizard:'Pháp sư',knight:'Chiến binh',elf:'Tiên nữ',gladiator:'Đấu sĩ',darklord:'Chúa tể'}[it.classId])||'Chiến đấu');n=slot+' '+family+' · Bộ '+(n.match(/\d+/)?.[0]||'1');}return n;}
module.exports={name};
