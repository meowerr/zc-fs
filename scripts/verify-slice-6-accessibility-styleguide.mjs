// scripts/verify-slice-6-accessibility-styleguide.mjs
// Automated verification for Slice 6: Accessibility, StyleGuide & Full Suite Verification
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

console.log('='.repeat(80));
console.log('🏎️  SLICE 6 VERIFICATION: ACCESSIBILITY, STYLEGUIDE & SUITE AUDIT');
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
// 2. Accessibility & ARIA Semantics Check
// ----------------------------------------------------------------------------
console.log('\n[2/5] Verifying Accessibility & ARIA Semantics...');
const railContent = fs.readFileSync('src/components/layout/HybridRacingRail.tsx', 'utf8');
const garageContent = fs.readFileSync('src/components/layout/GarageDoorNav.tsx', 'utf8');
const cssContent = fs.readFileSync('src/index.css', 'utf8');

assert(railContent.includes('aria-expanded={isOpen}'), 'HybridRacingRail communicates expansion state via aria-expanded.');
assert(railContent.includes('aria-pressed={isPinned}'), 'Pin toggle button communicates docked state via aria-pressed.');
assert(railContent.includes("aria-current={isActive ? 'page' : undefined}"), 'Active destination identified via aria-current="page".');
assert(railContent.includes('role="tooltip"'), 'Instant hover cyber tooltips provide role="tooltip".');

assert(garageContent.includes('role="dialog"'), 'Mobile Garage Door modal uses role="dialog".');
assert(garageContent.includes('aria-modal="true"'), 'Garage Door sheet declares aria-modal="true".');
assert(garageContent.includes("e.key === 'Escape'"), 'Garage Door supports keyboard Escape dismiss.');

assert(cssContent.includes('@media (prefers-reduced-motion: reduce)'), 'Global reduced-motion media query suppresses animations for sensitive users.');

// ----------------------------------------------------------------------------
// 3. StyleGuide Showcase Check
// ----------------------------------------------------------------------------
console.log('\n[3/5] Verifying /styleguide Architecture Showcase...');
const styleGuideContent = fs.readFileSync('src/components/styleguide/StyleGuide.tsx', 'utf8');

assert(styleGuideContent.includes('9. Hybrid Racing Rail & Mobile Navigation'), 'Section 9 present in StyleGuide.tsx.');
assert(styleGuideContent.includes('Desktop Hybrid Racing Rail (72px → 288px)'), 'Desktop Hybrid Racing Rail architecture documented.');
assert(styleGuideContent.includes('Mobile "Garage Door" Navigation'), 'Mobile Garage Door Navigation architecture documented.');
assert(styleGuideContent.includes('--rail-offset'), 'Zero-reflow CSS variable layout pattern documented in styleguide.');

// ----------------------------------------------------------------------------
// 4. Verify Prior Slices Pass Flawlessly
// ----------------------------------------------------------------------------
console.log('\n[4/5] Running Slices 1 to 5 Test Verification Suite...');
try {
  execSync('node scripts/verify-nav-config.mjs', { encoding: 'utf8' });
  assert(true, 'Slice 1 (Nav Config & Role Parity) passed.');
} catch (err) {
  assert(false, `Slice 1 failed: ${err.message}`);
}

try {
  execSync('node scripts/verify-slice-rail-base.mjs', { encoding: 'utf8' });
  assert(true, 'Slice 2 (Floating Rail Base & Shell) passed.');
} catch (err) {
  assert(false, `Slice 2 failed: ${err.message}`);
}

try {
  execSync('node scripts/verify-slice-3-expansion.mjs', { encoding: 'utf8' });
  assert(true, 'Slice 3 (Expansion & Interaction Layer) passed.');
} catch (err) {
  assert(false, `Slice 3 failed: ${err.message}`);
}

try {
  execSync('node scripts/verify-slice-4-telemetry.mjs', { encoding: 'utf8' });
  assert(true, 'Slice 4 (Visual Language & Telemetry) passed.');
} catch (err) {
  assert(false, `Slice 4 failed: ${err.message}`);
}

try {
  execSync('node scripts/verify-slice-5-responsive.mjs', { encoding: 'utf8' });
  assert(true, 'Slice 5 (Responsive Tablet & Mobile Garage Door) passed.');
} catch (err) {
  assert(false, `Slice 5 failed: ${err.message}`);
}

// ----------------------------------------------------------------------------
// 5. Final Production Build & Strict Bundle Budget Audit
// ----------------------------------------------------------------------------
console.log('\n[5/5] Auditing Final Production Bundle & Gzip Budgets...');
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

  console.log(`\n  📦 Total Gzip Bundle: ${totalGzipKb} KB (Budget: < 200 KB)`);
  console.log(`  ⚡ Main JS Chunk:     ${mainJsKb} KB (Budget: < 50 KB)`);

  assert(totalGzipBytes < 200 * 1024, `Total gzipped bundle (${totalGzipKb} KB) is strictly below 200 KB limit.`);
  assert(mainJsGzipBytes < 50 * 1024, `Main JS chunk (${mainJsKb} KB) is strictly below 50 KB limit.`);
} catch (err) {
  assert(false, `Final build verification failed: ${err.message}`);
}

console.log('\n' + '='.repeat(80));
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 SLICE 6 VERIFIED: Hybrid Racing Rail Layout Redesign 100% Complete & Verified.\n');
}
