import fs from 'fs';
import path from 'path';

console.log('Testing module resolver');
try {
  const babelParser = await import('@babel/parser');
  console.log('Babel parser available:', Boolean(babelParser.parse));
} catch (e) {
  console.log('Babel parser not directly resolvable:', e.message);
}

try {
  const eslint = await import('eslint');
  console.log('ESLint available:', Boolean(eslint));
} catch (e) {
  console.log('ESLint not resolvable:', e.message);
}
