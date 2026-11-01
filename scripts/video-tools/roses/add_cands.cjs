// usage: node add_cands.cjs < lines "id label words..."  -> appends "kNNN id # label" to cand_raw.txt (skips ids already present)
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, 'cand_raw.txt');
const have = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split(/\r?\n/).filter(Boolean) : [];
const ids = new Set(have.map((l) => l.split(' ')[1]));
let n = have.length;
const add = [];
fs.readFileSync(0, 'utf8').split(/\r?\n/).forEach((l) => {
  l = l.trim(); if (!l) return;
  const [id, ...rest] = l.split(/\s+/);
  if (ids.has(id)) return; ids.add(id); n++;
  add.push('k' + String(n).padStart(3, '0') + ' ' + id + ' # ' + rest.join(' '));
});
fs.appendFileSync(f, (have.length ? '\n' : '') + add.join('\n'));
console.log('added', add.length, 'total', n);
