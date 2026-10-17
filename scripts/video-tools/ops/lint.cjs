const fs = require('fs');
const PhpParser = require('php-parser');
const f = process.argv[2];
try {
  new PhpParser({ parser: { extractDoc: false, suppressErrors: false }, ast: { withPositions: false } }).parseCode(fs.readFileSync(f, 'utf8'));
  console.log('SYNTAX OK', f);
} catch (e) { console.log('SYNTAX ERROR', f, String(e.message).slice(0, 300)); process.exit(1); }
