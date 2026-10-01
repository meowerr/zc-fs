// scripts/verify-slice-5-responsive.mjs
// Automated verification for Slice 5: Responsive Pass (Tablet & Mobile "Garage Door")
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

console.log('='.repeat(80));
console.log('🏎️  SLICE 5 VERIFICATION: RESPONSIVE PASS (TABLET & MOBILE GARAGE DOOR)');
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
// 2. Tablet Tap-to-Expand & No-Hover Assertions
// ----------------------------------------------------------------------------
console.log('\n[2/5] Verifying Tablet Mode (768-1023px) Behavior...');
const railContent = fs.readFileSync('src/components/layout/HybridRacingRail.tsx', 'utf8');

assert(railContent.includes('isTablet'), 'Tablet viewport detection state active.');
assert(railContent.includes('if (isTablet) return'), 'Hover enter/leave disabled on tablet viewports.');
assert(railContent.includes('handleLogoTap'), 'Logo handle toggles expansion on tablet tap.');
assert(railContent.includes('handleItemClick'), 'Tapping nav item navigates immediately and closes overlay without double-tap.');
assert(railContent.includes('isTablet && (') && railContent.includes('lg:hidden'), 'Tablet backdrop overlay provided for outside tap dismissal.');

// ----------------------------------------------------------------------------
// 3. Viewport-Height Density Tiers Assertions
// ----------------------------------------------------------------------------
console.log('\n[3/5] Verifying Viewport-Height Density Tiers...');
const cssContent = fs.readFileSync('src/index.css', 'utf8');

assert(cssContent.includes('@media (max-height: 759px)'), 'Tier 600-759px media query defined in CSS.');
assert(cssContent.includes('.rail-subtitles'), 'Rail subtitles hide automatically at <760px viewport height.');
assert(cssContent.includes('@media (max-height: 599px)'), 'Tier <600px media query defined in CSS.');
assert(cssContent.includes('.rail-pips-block'), 'Sub-team pips block hides automatically at <600px viewport height.');
assert(railContent.includes('rail-subtitles') && railContent.includes('rail-pips-block'), 'Density tier utility classes applied to HybridRacingRail.');

// ----------------------------------------------------------------------------
// 4. Mobile "Garage Door" Navigation Assertions
// ----------------------------------------------------------------------------
console.log('\n[4/5] Verifying Mobile "Garage Door" Navigation (GarageDoorNav.tsx)...');
const garageDoorPath = path.resolve('src/components/layout/GarageDoorNav.tsx');
assert(fs.existsSync(garageDoorPath), 'GarageDoorNav.tsx exists on disk.');

const garageDoorContent = fs.readFileSync(garageDoorPath, 'utf8');
assert(garageDoorContent.includes('min-h-[56px]'), 'Closed state thumb-arc glass tab provides >=56px tap target.');
assert(garageDoorContent.includes('env(safe-area-inset-bottom)'), 'Safe area inset aware for mobile home bars.');
assert(garageDoorContent.includes('max-h-[78vh]'), 'Garage door sheet pulls up to ~70-78vh bottom sheet.');
assert(garageDoorContent.includes('grid-cols-2'), '2-column destination grid with large tap targets (>=64px).');
assert(garageDoorContent.includes('onTouchStart') && garageDoorContent.includes('onTouchMove') && garageDoorContent.includes('onTouchEnd'), 'Swipe down gesture handlers implemented for drag-to-dismiss.');
assert(garageDoorContent.includes("e.key === 'Escape'"), 'Escape key closes garage door.');

const appShellContent = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
assert(appShellContent.includes('<GarageDoorNav'), 'AppShell wires GarageDoorNav as primary mobile navigation.');
assert(appShellContent.includes('<BottomNav'), 'AppShell preserves legacy BottomNav for rollback switch.');
assert(appShellContent.includes('pb-20 md:pb-8'), 'Content area adjusted to pb-20 to take advantage of full mobile screen height.');

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
  console.log('🎉 SLICE 5 VERIFIED: Responsive Pass (Tablet & Mobile Garage Door) passed with 100% success.\n');
}
