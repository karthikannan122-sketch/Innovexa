import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

const JS_GLOBALS = new Set([
  'window', 'document', 'console', 'localStorage', 'sessionStorage', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'fetch', 'Promise', 'Math', 'Date', 'JSON', 'Object', 'Array',
  'String', 'Number', 'Boolean', 'RegExp', 'Error', 'TypeError', 'ReferenceError', 'Set', 'Map',
  'WeakSet', 'WeakMap', 'Symbol', 'BigInt', 'Intl', 'URL', 'URLSearchParams', 'FormData',
  'Blob', 'File', 'FileReader', 'CustomEvent', 'Event', 'EventTarget', 'navigator', 'location',
  'history', 'alert', 'confirm', 'prompt', 'requestAnimationFrame', 'cancelAnimationFrame',
  'performance', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'undefined', 'NaN', 'Infinity', 'globalThis',
  'process', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
  'DOMParser', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'crypto', 'atob', 'btoa',
  'Audio', 'Image', 'Option', 'HTMLElement', 'Element', 'Node', 'CanvasRenderingContext2D',
  'WebGLRenderingContext', 'WebGL2RenderingContext', 'Response', 'Request', 'Headers'
]);

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
console.log(`Found ${allFiles.length} source files to inspect for undefined references.\n`);

const issues = [];

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
    issues.push({
      file: relPath,
      line: err.loc?.line || 0,
      name: 'PARSER_ERROR',
      type: 'Syntax/Parse Error: ' + err.message
    });
    continue;
  }

  traverse(ast, {
    Identifier(astPath) {
      const name = astPath.node.name;
      
      // Skip declarations, property keys, object keys, import specifiers, labels, etc.
      if (
        astPath.parentPath.isMemberExpression({ property: astPath.node }) && !astPath.parent.computed
      ) {
        return;
      }
      if (
        astPath.parentPath.isOptionalMemberExpression({ property: astPath.node }) && !astPath.parent.computed
      ) {
        return;
      }
      if (
        astPath.parentPath.isObjectProperty({ key: astPath.node }) && !astPath.parent.computed
      ) {
        return;
      }
      if (astPath.parentPath.isObjectMethod({ key: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isClassMethod({ key: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isClassProperty({ key: astPath.node })) {
        return;
      }
      if (
        astPath.parentPath.isImportSpecifier() ||
        astPath.parentPath.isImportDefaultSpecifier() ||
        astPath.parentPath.isImportNamespaceSpecifier() ||
        astPath.parentPath.isExportSpecifier()
      ) {
        return;
      }
      if (astPath.parentPath.isMetaProperty()) {
        return;
      }
      if (astPath.parentPath.isFunctionDeclaration({ id: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isFunctionExpression({ id: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isVariableDeclarator({ id: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isCatchClause({ param: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isRestElement({ argument: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isLabeledStatement({ label: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isBreakStatement({ label: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isContinueStatement({ label: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isJSXAttribute({ name: astPath.node })) {
        return;
      }
      if (astPath.parentPath.isJSXClosingElement()) {
        return;
      }

      // Check if global
      if (JS_GLOBALS.has(name)) {
        return;
      }

      // Check if in scope
      const binding = astPath.scope.getBinding(name);
      if (!binding && !astPath.scope.hasGlobal(name)) {
        // Special check: is it a JSX tag name that is lowercase (e.g. div, span)?
        if (astPath.parentPath.isJSXOpeningElement({ name: astPath.node }) && /^[a-z]/.test(name)) {
          return;
        }

        const loc = astPath.node.loc?.start || { line: 0, column: 0 };
        issues.push({
          file: relPath,
          line: loc.line,
          column: loc.column,
          name: name,
          type: 'UNDEFINED_REFERENCE'
        });
      }
    }
  });
}

console.log('================================================================');
console.log(`ANALYSIS COMPLETE: Found ${issues.length} potential issues`);
console.log('================================================================\n');

// Group issues by file
const grouped = {};
for (const issue of issues) {
  grouped[issue.file] = grouped[issue.file] || [];
  grouped[issue.file].push(issue);
}

for (const [file, list] of Object.entries(grouped)) {
  console.log(`\n📄 [FILE]: ${file} (${list.length} issues)`);
  for (const item of list) {
    console.log(`  Line ${item.line}:${item.column} -> ${item.name} (${item.type})`);
  }
}
