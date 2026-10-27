const fs=require('fs');
for(const f of process.argv.slice(2)){const md=fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n').trim();const w=(md.match(/[\p{L}\p{N}]+(?:[’‘'-][\p{L}\p{N}]+)*/gu)||[]).length;console.log(f,w,'words',md.startsWith('## Σύντομη Απάντηση')?'ok-start':'BAD START');}
