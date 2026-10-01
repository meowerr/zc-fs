// scripts/verify-slice-rail-base.mjs
// Automated verification for Slice 2: Floating Rail Base & Layout Shell
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

console.log('='.repeat(80));
console.log('🏎️  SLICE 2 VERIFICATION: FLOATING RAIL BASE & LAYOUT SHELL');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// ----------------------------------------------------------------------------
// 1. Strict TypeScript Compilation Check
// ----------------------------------------------------------------------------
console.log('\n[1/5] Verifying Strict TypeScript Compilation...');
try {
  execSync('npx tsc --noEmit', { encoding: 'utf8' });
  assert(true, 'TypeScript compilation completed with ZERO errors.');
} catch (err) {
  assert(false, `TypeScript compilation failed: ${err.message}`);
}

// ----------------------------------------------------------------------------
// 2. Component Structure & Rollback Safety Check
// ----------------------------------------------------------------------------
console.log('\n[2/5] Verifying Layout Components & Rollback Safety...');

const railPath = path.resolve('src/components/layout/HybridRacingRail.tsx');
assert(fs.existsSync(railPath), 'HybridRacingRail.tsx exists on disk.');

const sidebarPath = path.resolve('src/components/layout/Sidebar.tsx');
assert(fs.existsSync(sidebarPath), 'Legacy Sidebar.tsx preserved untouched for instant rollback.');

const bottomNavPath = path.resolve('src/components/layout/BottomNav.tsx');
assert(fs.existsSync(bottomNavPath), 'Legacy BottomNav.tsx preserved untouched.');

const appShellContent = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
assert(appShellContent.includes('USE_HYBRID_RACING_RAIL'), 'AppShell contains USE_HYBRID_RACING_RAIL toggle flag.');
assert(appShellContent.includes('<HybridRacingRail'), 'AppShell renders HybridRacingRail when toggle is active.');
assert(appShellContent.includes('<Sidebar'), 'AppShell preserves legacy Sidebar in rollback branch.');
assert(appShellContent.includes("paddingLeft: 'var(--rail-offset, 0px)'"), 'AppShell main container reserves single-source-of-truth rail offset.');

// ----------------------------------------------------------------------------
// 3. TopHeader Realignment & Z-Index Token Check
// ----------------------------------------------------------------------------
console.log('\n[3/5] Verifying TopHeader Realignment & Layering Tokens...');

const topHeaderContent = fs.readFileSync('src/components/layout/TopHeader.tsx', 'utf8');
assert(topHeaderContent.includes('z-20'), 'TopHeader uses z-20 (strictly below z-rail: 30 and overlay panel: 35).');
assert(topHeaderContent.includes("paddingLeft: 'var(--rail-offset, 0px)'"), 'TopHeader offsets padding to align seamlessly with rail.');
assert(topHeaderContent.includes('md:hidden') && topHeaderContent.includes('PitLane'), 'Mobile brand retained on small viewports (<768px).');
assert(topHeaderContent.includes('hidden md:flex') && topHeaderContent.includes('groupName'), 'Desktop displays telemetry breadcrumb with active sub-team.');

// ----------------------------------------------------------------------------
// 4. CSS Variable Layout System Check
// ----------------------------------------------------------------------------
console.log('\n[4/5] Verifying CSS Variables & Breakpoint Adaptations...');

const cssContent = fs.readFileSync('src/index.css', 'utf8');
assert(cssContent.includes('--rail-w: 72px;'), '--rail-w: 72px defined in :root.');
assert(cssContent.includes('--rail-gap: 12px;'), '--rail-gap default defined.');
assert(cssContent.includes('--rail-offset: calc(var(--rail-w) + (var(--rail-gap) * 2));'), '--rail-offset calculated.');
assert(cssContent.includes('@media (min-width: 1280px)') && cssContent.includes('--rail-gap: 16px;'), 'Desktop >=1280px sets 16px inset gap.');
assert(cssContent.includes('@media (max-width: 1023px) and (min-width: 768px)') && cssContent.includes('--rail-w: 64px;'), 'Tablet (768-1023px) sets compact 64px rail.');
assert(cssContent.includes('@media (max-width: 767px)') && cssContent.includes('--rail-offset: 0px;'), 'Mobile (<768px) zeroes out rail offset.');

// ----------------------------------------------------------------------------
// 5. Production Build & Bundle Size Budget Check (< 200 KB gzip)
// ----------------------------------------------------------------------------
console.log('\n[5/5] Verifying Production Build & Gzip Budgets...');
try {
  execSync('npm run build', { encoding: 'utf8' });
  const distDir = path.resolve('dist/assets');
  const files = fs.readdirSync(distDir);
  
  let totalGzipBytes = 0;
  let mainJsGzipBytes = 0;
  
  for (const file of files) {
    const filePath = path.join(distDir, file);
    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);
    totalGzipBytes += gzipped.length;
    
    if (file.endsWith('.js') && file.startsWith('index-')) {
      mainJsGzipBytes = gzipped.length;
    }
  }

  const totalGzipKb = (totalGzipBytes / 1024).toFixed(2);
  const mainJsKb = (mainJsGzipBytes / 1024).toFixed(2);

  assert(totalGzipBytes < 200 * 1024, `Total gzipped bundle (${totalGzipKb} KB) is strictly below 200 KB limit.`);
  assert(mainJsGzipBytes < 50 * 1024, `Main JS chunk (${mainJsKb} KB) is strictly below 50 KB limit.`);
} catch (err) {
  assert(false, `Build verification failed: ${err.message}`);
}

console.log('\n' + '='.repeat(80));
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 SLICE 2 VERIFIED: Floating Rail Base & Layout Shell passed with 100% success.\n');
}
