import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, exts = ['.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, exts));
    } else if (exts.includes(path.extname(file))) {
      results.push(filePath);
    }
  }
  return results;
}

const allFiles = getAllFiles(srcDir);
console.log(`Auditing ${allFiles.length} components deeply...\n`);

const findings = [];

for (const filePath of allFiles) {
  const relPath = path.relative(__dirname, filePath).replace(/\\/g, '/');
  const code = fs.readFileSync(filePath, 'utf-8');

  let ast;
  try {
    ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport']
    });
  } catch (err) {
    findings.push({ file: relPath, message: 'Parse Error: ' + err.message });
    continue;
  }

  // 1. Check for review submission variables
  if (code.includes('isSubmittingReview')) {
    const hasState = code.includes('useState(') && code.includes('isSubmittingReview');
    if (!hasState) {
      findings.push({ file: relPath, message: 'CRITICAL: Uses isSubmittingReview without useState declaration!' });
    }
  }

  // 2. Check JSX event handlers
  traverse(ast, {
    JSXAttribute(p) {
      const attrName = p.node.name?.name;
      if (['onClick', 'onSubmit', 'onChange'].includes(attrName)) {
        const val = p.node.value;
        if (val && val.type === 'JSXExpressionContainer') {
          const expr = val.expression;
          if (expr.type === 'Identifier') {
            const idName = expr.name;
            const binding = p.scope.getBinding(idName);
            if (!binding) {
              findings.push({
                file: relPath,
                line: expr.loc?.start.line,
                message: `Event handler "${attrName}" points to undeclared identifier "${idName}"`
              });
            }
          }
        }
      }
    }
  });
}

console.log('================================================================');
console.log(`DEEP AUDIT COMPLETED: ${findings.length} findings`);
console.log('================================================================\n');

for (const f of findings) {
  console.log(`⚠️  [${f.file}${f.line ? `:${f.line}` : ''}] ${f.message}`);
}

if (findings.length === 0) {
  console.log('🎉 ALL React components pass deep event handler and state declaration checks!');
}
