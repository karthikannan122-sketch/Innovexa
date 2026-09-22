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
console.log('Searching for "solution" references in submit handlers, validations, or variables:');

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (
      line.toLowerCase().includes('solution') && 
      (line.includes('submit') || line.includes('handleSubmit') || line.includes('showToast') || line.includes('throw') || line.includes('error') || line.includes('validate') || line.includes('ReferenceError') || line.includes('proposed_solution'))
    ) {
      if (line.length < 200) {
        console.log(`${path.relative('.', f)}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
});
