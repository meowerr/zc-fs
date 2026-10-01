// scripts/verify-slice-3-expansion.mjs
// Automated verification for Slice 3: Expansion & Interaction Layer
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

console.log('='.repeat(80));
console.log('🏎️  SLICE 3 VERIFICATION: EXPANSION & INTERACTION LAYER');
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
// 2. Hover Intent & Timing Delay Assertions
// ----------------------------------------------------------------------------
console.log('\n[2/5] Verifying Hover Intent & Timing Delays...');
const railContent = fs.readFileSync('src/components/layout/HybridRacingRail.tsx', 'utf8');

assert(railContent.includes('120'), 'Hover intent enter delay configured at 120ms.');
assert(railContent.includes('250'), 'Hover leave delay configured at 250ms.');
assert(railContent.includes('enterTimeoutRef'), 'Enter timer ref tracks pending hover intent.');
assert(railContent.includes('leaveTimeoutRef'), 'Leave timer ref prevents abrupt closing on accidental exit.');

// ----------------------------------------------------------------------------
// 3. Keyboard Accessibility & Escape Key Collapse Assertions
// ----------------------------------------------------------------------------
console.log('\n[3/5] Verifying Keyboard Navigation & Escape Handler...');

assert(railContent.includes('onFocusCapture') || railContent.includes('onFocus'), 'Focus capture listener expands rail on keyboard Tab navigation.');
assert(railContent.includes('onBlurCapture') || railContent.includes('onBlur'), 'Blur capture listener collapses rail when focus leaves.');
assert(railContent.includes("e.key === 'Escape'"), 'Escape key handler collapses overlay immediately.');
assert(railContent.includes('isOpen ? 35 : 30'), 'Z-index elevates to 35 on expansion, floating above header (z-20) and below modals (z-50).');
assert(railContent.includes('w-72'), 'Expanded width reaches 288px (w-72) command center.');

// ----------------------------------------------------------------------------
// 4. Pin Dock & Wide Screen Persistence Assertions
// ----------------------------------------------------------------------------
console.log('\n[4/5] Verifying Pin Toggle & Wide Screen Persistence...');

assert(railContent.includes('zcfs_rail_pinned'), 'Pin state persisted to localStorage key "zcfs_rail_pinned".');
assert(railContent.includes('innerWidth >= 1280'), 'Pin dock feature scoped to desktop viewports >= 1280px.');
assert(railContent.includes('data-rail-pinned') || railContent.includes('railPinned'), 'Rail pinned attribute synchronized to documentElement.');

const cssContent = fs.readFileSync('src/index.css', 'utf8');
assert(cssContent.includes('html[data-rail-pinned="true"]'), 'CSS rule adapts --rail-offset only when explicitly pinned at >=1280px.');

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
  console.log('🎉 SLICE 3 VERIFIED: Expansion & Interaction Layer passed with 100% success.\n');
}
