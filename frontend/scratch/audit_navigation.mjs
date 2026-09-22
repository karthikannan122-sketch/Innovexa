import fs from 'fs';
import path from 'path';

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const appCode = fs.readFileSync('./src/App.jsx', 'utf8');

// Extract all activeTab conditionals in App.jsx: activeTab === '...'
const handledTabs = new Set();
const tabRegex = /activeTab\s*===\s*['"]([^'"]+)['"]/g;
let match;
while ((match = tabRegex.exec(appCode)) !== null) {
  handledTabs.add(match[1]);
}

console.log('Tabs handled in App.jsx:', Array.from(handledTabs).sort());

console.log('\n--- AUDITING ALL PAGES IN SRC/PAGES ---');

const missingTabsFound = new Map();

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  const code = fs.readFileSync(filePath, 'utf8');

  // Extract signature / props
  const firstFunction = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/);
  const compName = firstFunction ? firstFunction[1] : file.replace('.jsx', '');
  const props = firstFunction ? firstFunction[2].trim() : 'unknown';

  // Find all setActiveTab('...') calls
  const pageTabs = [];
  const setTabRegex = /setActiveTab\(\s*['"]([^'"]+)['"]/g;
  let tm;
  while ((tm = setTabRegex.exec(code)) !== null) {
    pageTabs.push(tm[1]);
    if (!handledTabs.has(tm[1])) {
      if (!missingTabsFound.has(tm[1])) missingTabsFound.set(tm[1], []);
      missingTabsFound.get(tm[1]).push(file);
    }
  }

  // Also find dynamic setActiveTab(x)
  const dynRegex = /setActiveTab\(\s*([a-zA-Z0-9_.]+)\s*\)/g;
  let dm;
  while ((dm = dynRegex.exec(code)) !== null) {
    if (!['landing', 'login', 'signup', 'onboarding', 'dashboard', 'explore', 'community', 'research', 'submit', 'queue', 'review_submit', 'detail', 'creator', 'profile', 'settings', 'admin', 'tab', 'item.key', 'dest', 'activeTab'].includes(dm[1])) {
      // console.log(`  Dynamic setActiveTab(${dm[1]}) in ${file}`);
    }
  }

  console.log(`\nPage: ${compName} (${file})`);
  console.log(`  Props: ${props}`);
  console.log(`  Tabs triggered: ${[...new Set(pageTabs)].join(', ') || 'none'}`);
});

console.log('\n========================================');
console.log('MISSING TABS (Triggered by pages but NOT handled in App.jsx):');
for (const [tab, pageList] of missingTabsFound.entries()) {
  console.log(`  Tab '${tab}' -> called in: ${[...new Set(pageList)].join(', ')}`);
}
console.log('========================================');
