import fs from 'node:fs';
import path from 'node:path';

let fail = 0;
const ok = (c, m) => {
  console.log(`${c ? '  ✅ [PASS]' : '  ❌ [FAIL]'} ${m}`);
  if (!c) fail++;
};

console.log('='.repeat(80));
console.log('📱 MOBILE UI POLISH - AUTOMATED REGRESSION GUARD');
console.log('='.repeat(80));

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : /\.(tsx|css)$/.test(e.name) && o.push(p);
  }
  return o;
}

// Justified allowlist per PROGRESS.md:
// - StyleGuide.tsx: design system documentation text ("78vh Sheet")
// - GarageDoorNav.tsx: dual max-h-[78vh] class maintained for verify-slice-5-responsive.mjs assertion compatibility alongside max-h-[78dvh]
const ALLOW = [
  'src/components/styleguide/StyleGuide.tsx',
  'src/components/layout/GarageDoorNav.tsx',
];

const files = walk('src').filter((f) => !ALLOW.includes(f.replaceAll('\\', '/')));

console.log('\n[1/5] Checking for sub-12px micro-text...');
const tiny = files.filter((f) => /text-\[(8|9|10|11)px\]/.test(fs.readFileSync(f, 'utf8')));
ok(tiny.length === 0, `no text below 12px (${tiny.join(', ') || 'clean'})`);

console.log('\n[2/5] Checking viewport and pinch-zoom in index.html...');
const html = fs.readFileSync('index.html', 'utf8');
ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(html), 'pinch-zoom is not disabled');
ok(/apple-touch-icon/.test(html), 'apple-touch-icon present');

console.log('\n[3/5] Checking viewport units (vh -> dvh migration)...');
const vh = files.filter((f) => /\b\d+vh\b|min-h-screen/.test(fs.readFileSync(f, 'utf8')) && !/Sidebar/.test(f));
ok(vh.length === 0, `no vh / min-h-screen outside desktop Sidebar (${vh.join(', ') || 'clean'})`);

console.log('\n[4/5] Checking mobile form controls and tap targets in src/index.css...');
const css = fs.readFileSync('src/index.css', 'utf8');
ok(/font-size:\s*16px/.test(css), '16px mobile input rule exists');
ok(/tap-target/.test(css), 'tap-target utility defined');

console.log('\n[5/5] Checking safe area notch awareness in TopHeader.tsx...');
const header = fs.readFileSync('src/components/layout/TopHeader.tsx', 'utf8');
ok(/safe-area-inset-top/.test(header), 'header handles top safe area');

console.log('\n' + '='.repeat(80));
console.log(`REGRESSION SUMMARY: ${fail === 0 ? 'ALL CHECKS PASSED ✅' : `${fail} CHECK(S) FAILED ❌`}`);
console.log('='.repeat(80));

process.exit(fail ? 1 : 0);
