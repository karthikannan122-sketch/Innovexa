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
const tabCalls = new Map();

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const regex = /setActiveTab\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = regex.exec(code)) !== null) {
    const tab = m[1];
    if (!tabCalls.has(tab)) tabCalls.set(tab, []);
    tabCalls.get(tab).push(path.relative('./src', f));
  }
});

console.log('All tabs used with setActiveTab:');
for (const [tab, srcFiles] of tabCalls.entries()) {
  console.log(`Tab '${tab}' (${srcFiles.length} occurrences) used in:`, [...new Set(srcFiles)].join(', '));
}
