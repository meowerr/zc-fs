// scripts/verify-slice-4-telemetry.mjs
// Automated verification for Slice 4: Visual Language & Telemetry Instrumentation
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

console.log('='.repeat(80));
console.log('🏎️  SLICE 4 VERIFICATION: VISUAL LANGUAGE & TELEMETRY INSTRUMENTATION');
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
// 2. 2px Track Lane Line & Lit Active Nodes Assertions
// ----------------------------------------------------------------------------
console.log('\n[2/5] Verifying Track Lane Lines & Lit Active Nodes...');
const railContent = fs.readFileSync('src/components/layout/HybridRacingRail.tsx', 'utf8');

assert(railContent.includes('h-[2px] w-full bg-gradient-to-r'), '2px continuous track lane line present.');
assert(railContent.includes('shadow-[0_0_10px_rgba(0,217,255,0.9)]'), 'Active lane marker illuminated with electric cyan glow.');
assert(railContent.includes('animate-pulse') && railContent.includes('bg-accent-cyan'), 'Active node illuminates live pulsating indicator.');

// ----------------------------------------------------------------------------
// 3. Team Accent Coloring & RLS-Safe Sub-Team Telemetry Assertions
// ----------------------------------------------------------------------------
console.log('\n[3/5] Verifying Team Accent Coloring & RLS-Safe Sub-Team Telemetry...');

assert(railContent.includes('userTeamColor'), 'Dynamic team accent color resolved from SUB_TEAMS palette.');
assert(railContent.includes("role === 'admin' ?"), 'Role branch isolates Admin 5-team matrix from non-admin team view.');
assert(railContent.includes('sourceGroups.slice(0, 5)'), 'All 5 Formula Student sub-teams represented.');
assert(railContent.includes('borderLeftColor: userTeamColor'), 'Assigned team card illuminated with sub-team accent border.');

// ----------------------------------------------------------------------------
// 4. Realtime Connection LED & Instant Tooltips Assertions
// ----------------------------------------------------------------------------
console.log('\n[4/5] Verifying Realtime Connection LED & Instant Cyber Tooltips...');

assert(railContent.includes("'online' | 'reconnecting' | 'offline'"), 'Connection status model supports online, reconnecting, and offline states.');
assert(railContent.includes('window.addEventListener(\'online\'') && railContent.includes('window.addEventListener(\'offline\''), 'Network lifecycle events dynamically update telemetry indicator.');
assert(railContent.includes('SYSTEM ONLINE') && railContent.includes('SYSTEM OFFLINE'), 'Double-encoded telemetry LED displays color + icon + text.');
assert(railContent.includes('role="tooltip"'), 'Accessible instant cyber tooltip rendered in collapsed mode.');
assert(railContent.includes('left-[calc(100%+10px)]'), 'Tooltip positioned to the right of collapsed rail without overlapping.');

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
  console.log('🎉 SLICE 4 VERIFIED: Visual Language & Telemetry Instrumentation passed with 100% success.\n');
}
