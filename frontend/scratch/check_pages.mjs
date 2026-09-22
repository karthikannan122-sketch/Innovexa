import fs from 'fs';
import path from 'path';

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

console.log(`Found ${files.length} pages in src/pages.`);

const appCode = fs.readFileSync('./src/App.jsx', 'utf8');

// Check which pages are imported in App.jsx
files.forEach(file => {
  const compName = file.replace('.jsx', '');
  const isImported = appCode.includes(compName);
  const isRendered = appCode.includes(`<${compName}`) || appCode.includes(`activeTab === '${compName.toLowerCase()}'`);
  console.log(`Page: ${file.padEnd(25)} | Imported: ${isImported ? 'YES' : 'NO '} | Rendered in App.jsx: ${isRendered ? 'YES' : 'NO '}`);
});
