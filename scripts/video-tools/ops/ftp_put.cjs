// usage (cwd = repo root): node ftp_put.cjs get <remote> <local>   |   node ftp_put.cjs put <local> <remote>
const fs=require('fs'),path=require('path');
const env={};for(const l of fs.readFileSync('.env.deploy','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!l.trim().startsWith('#'))env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
(async()=>{const {Client}=require(path.join(process.cwd(),'node_modules','basic-ftp'));const c=new Client(60000);
try{await c.access({host:'185.29.24.7',user:env.FTP_USER,password:env.FTP_PASSWORD,secure:false});
const [mode,a,b]=process.argv.slice(2);
if(mode==='get'){await c.downloadTo(b,'/httpdocs/'+a);console.log('got',a);}
else{const rp='/httpdocs/'+b;await c.ensureDir(path.posix.dirname(rp));await c.cd('/');await c.uploadFrom(a,rp);console.log('put',b);}
}catch(e){console.log('ERROR',String(e.message||e).slice(0,200));process.exitCode=1;}c.close();})();
