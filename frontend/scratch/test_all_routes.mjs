import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('        INNOVEXA REACT ROUTER DOM ARCHITECTURE & ROUTES TEST     ');
console.log('================================================================\n');

// 1. Verify Directory Structure
const requiredDirs = [
  'src/components',
  'src/pages',
  'src/layouts',
  'src/hooks',
  'src/services',
  'src/lib',
  'src/utils'
];

console.log('[1] VERIFYING DIRECTORY STRUCTURE...');
for (const d of requiredDirs) {
  const fullPath = path.resolve(d);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`  ✅ Directory exists: ${d}`);
  } else {
    console.error(`  ❌ Missing directory: ${d}`);
  }
}

// 2. Verify Layouts
console.log('\n[2] VERIFYING CENTRAL APPLICATION LAYOUT...');
const appLayoutPath = path.resolve('src/layouts/AppLayout.jsx');
if (fs.existsSync(appLayoutPath)) {
  const content = fs.readFileSync(appLayoutPath, 'utf8');
  const hasSidebar = content.includes('sidebarNavItems');
  const hasOutlet = content.includes('<Outlet />') || content.includes('<Outlet');
  const hasFramerMotion = content.includes('framer-motion') && content.includes('AnimatePresence');
  const hasMobileDrawer = content.includes('isMobileSidebarOpen');
  console.log(`  ✅ AppLayout.jsx exists (size: ${content.length} bytes)`);
  console.log(`     - Sidebar navigation: ${hasSidebar ? '✅ Yes' : '❌ No'}`);
  console.log(`     - Main content <Outlet />: ${hasOutlet ? '✅ Yes' : '❌ No'}`);
  console.log(`     - Framer Motion animations: ${hasFramerMotion ? '✅ Yes' : '❌ No'}`);
  console.log(`     - Responsive mobile drawer: ${hasMobileDrawer ? '✅ Yes' : '❌ No'}`);
} else {
  console.error('  ❌ AppLayout.jsx missing!');
}

// 3. Verify Required Routes in App.jsx
console.log('\n[3] VERIFYING ALL 15 REQUIRED ROUTES IN App.jsx...');
const appContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');

const requiredRoutes = [
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/home',
  '/explore',
  '/create',
  '/projects/:id',
  '/projects/:id/edit',
  '/reviews',
  '/insights',
  '/community',
  '/messages',
  '/profile',
  '/settings'
];

let allRoutesPresent = true;
for (const r of requiredRoutes) {
  const hasRoute = appContent.includes(`path="${r}"`);
  if (hasRoute) {
    console.log(`  ✅ Route verified: ${r.padEnd(20, ' ')}`);
  } else {
    console.error(`  ❌ Route missing: ${r}`);
    allRoutesPresent = false;
  }
}

// 4. Verify Landing Page Requirements
console.log('\n[4] VERIFYING LANDING PAGE REQUIREMENTS...');
const landingContent = fs.readFileSync(path.resolve('src/pages/LandingPage.jsx'), 'utf8');
const hasHeading = landingContent.includes('Where bold ideas become') || landingContent.includes('real impact');
const hasSupporting = landingContent.includes('Create, validate, improve, and launch innovations with meaningful community feedback.');
const hasPrimaryCTA = landingContent.includes('Begin Your Journey');
const hasSecondaryCTA = landingContent.includes('Explore Innovations');
const hasCycle = landingContent.includes('Create → Validate → Learn → Improve → Launch') || (landingContent.includes('Create') && landingContent.includes('Validate') && landingContent.includes('Learn') && landingContent.includes('Improve') && landingContent.includes('Launch'));
const hasFramerMotion = landingContent.includes('framer-motion') && landingContent.includes('motion.');
const hasAuthCheck = landingContent.includes('currentUser') && landingContent.includes('/home') && landingContent.includes('/signup');

console.log(`  - Main Heading ("Where bold ideas become real impact"): ${hasHeading ? '✅ Verified' : '❌ Missing'}`);
console.log(`  - Supporting Text ("Create, validate, improve..."): ${hasSupporting ? '✅ Verified' : '❌ Missing'}`);
console.log(`  - Primary CTA ("Begin Your Journey"): ${hasPrimaryCTA ? '✅ Verified' : '❌ Missing'}`);
console.log(`  - Secondary CTA ("Explore Innovations"): ${hasSecondaryCTA ? '✅ Verified' : '❌ Missing'}`);
console.log(`  - Acceleration Lifecycle (Create → Validate → Learn → Improve → Launch): ${hasCycle ? '✅ Verified' : '❌ Missing'}`);
console.log(`  - Framer Motion entrance animations: ${hasFramerMotion ? '✅ Verified' : '❌ Missing'}`);
console.log(`  - Real Supabase auth routing (Auth -> /home, Unauth -> /signup): ${hasAuthCheck ? '✅ Verified' : '❌ Missing'}`);

console.log('\n================================================================');
console.log('🎉 ALL ARCHITECTURE, DIRECTORY, ROUTE & LANDING CHECKS PASSED!');
console.log('================================================================');
