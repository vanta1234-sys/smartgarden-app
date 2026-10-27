// usage: node fixn.cjs <file.md> <pairs.cjs>   pairs.cjs exports [[old,new],...]; every old must occur exactly once or nothing is written
const fs=require('fs');
const [f,p]=process.argv.slice(2);
let t=fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n');
const pairs=require(require('path').resolve(p));
const bad=[];
for(const [a,b] of pairs){const n=t.split(a).length-1; if(n!==1) bad.push([n,a.slice(0,70)]);}
if(bad.length){console.log('NO CHANGE, problems:');bad.forEach(x=>console.log(' ',x[0],'x',x[1]));process.exit(1);}
for(const [a,b] of pairs) t=t.replace(a,()=>b);
fs.writeFileSync(f,t,'utf8');
console.log('applied',pairs.length,'pairs to',f);
