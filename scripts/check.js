const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const ignored = new Set(['node_modules', '.git']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.isDirectory() && !ignored.has(entry.name)) walk(path.join(dir, entry.name));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(path.join(dir, entry.name));
  }
}
walk(root);
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding:'utf8'});
  if (result.status !== 0) {
    failed++;
    process.stderr.write(`\n${path.relative(root,file)}\n${result.stderr}`);
  }
}
console.log(`Checked ${files.length} JavaScript files; ${failed} syntax error(s).`);
process.exitCode = failed ? 1 : 0;
