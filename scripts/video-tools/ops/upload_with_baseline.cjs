// Upload public/<name> only if the live copy equals the baseline copy (what we uploaded last time).
const fs=require('fs'),path=require('path');
const env={};for(const l of fs.readFileSync('.env.deploy','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!l.trim().startsWith('#'))env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const scratch=__dirname;
(async()=>{const {Client}=require(path.join(process.cwd(),'node_modules','basic-ftp'));const c=new Client(30000);
try{await c.access({host:'185.29.24.7',user:env.FTP_USER,password:env.FTP_PASSWORD,secure:false});
for(const n of process.argv.slice(2)){
  const tmp=path.join(scratch,'cur_'+n); await c.downloadTo(tmp,'/httpdocs/'+n);
  const base=fs.readFileSync(path.join(scratch,'after_'+n));
  if(Buffer.compare(fs.readFileSync(tmp),base)!==0){console.log(n,': ABORT live differs from last uploaded copy');continue;}
  await c.uploadFrom('public/'+n,'/httpdocs/'+n);
  await c.downloadTo(path.join(scratch,'after_'+n),'/httpdocs/'+n);
  console.log(n,': uploaded, identical to local:',Buffer.compare(fs.readFileSync(path.join(scratch,'after_'+n)),fs.readFileSync('public/'+n))===0);
}}catch(e){console.log('ERROR',String(e.message||e).slice(0,200));process.exitCode=1;}c.close();})();
