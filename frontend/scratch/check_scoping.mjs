import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.jsx') || file.endsWith('.js')) results.push(file);
  });
  return results;
}

const files = walk('./src');

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  // Check if const/let solution is inside if blocks
  const ifMatches = code.match(/if\s*\([^)]*\)\s*\{[^}]*\b(?:const|let)\s+([a-zA-Z0-9_]+)\s*=[^}]*\}/g);
  if (ifMatches) {
    ifMatches.forEach(block => {
      const vars = [...block.matchAll(/\b(?:const|let)\s+([a-zA-Z0-9_]+)\s*=/g)].map(m => m[1]);
      vars.forEach(v => {
        // see if v is used after the block
        const after = code.slice(code.indexOf(block) + block.length);
        const regex = new RegExp(`\\b${v}\\b`);
        if (regex.test(after)) {
          // Check if it was redeclared outside
          const before = code.slice(0, code.indexOf(block));
          if (!new RegExp(`\\b(?:const|let|var|function|param)\\s+${v}\\b`).test(before) && !new RegExp(`\\b(?:const|let|var)\\s+${v}\\b`).test(after)) {
            console.log(`POTENTIAL SCOPING ISSUE in ${f}: variable '${v}' declared inside if-block but used outside!`);
          }
        }
      });
    });
  }
});
