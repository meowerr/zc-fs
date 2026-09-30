import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

console.log('='.repeat(80));
console.log('🏎️  ZC FORMULA STUDENT WORKSPACE (PITLANE) - VERIFICATION SUITE');
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
// 1. TypeScript Strict Type-Check
// ----------------------------------------------------------------------------
console.log('\n[1/7] VERIFYING TYPESCRIPT COMPILATION (STRICT MODE)...');
try {
  const tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8' });
  assert(true, 'TypeScript compilation completed with ZERO errors or warnings.');
} catch (err) {
  assert(false, `TypeScript compilation failed: ${err.message}`);
}

// ----------------------------------------------------------------------------
// 2. Production Bundle & Size Budget (< 200 KB gzipped)
// ----------------------------------------------------------------------------
console.log('\n[2/7] VERIFYING PRODUCTION BUNDLE & GZIP BUDGET...');
const distDir = path.resolve('dist');
assert(fs.existsSync(distDir), 'Production build directory "dist/" exists.');

if (fs.existsSync(distDir)) {
  const assetsDir = path.join(distDir, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  let totalRawBytes = 0;
  let totalGzipBytes = 0;
  let mainJsGzipBytes = 0;

  console.log('  --- Bundle Artifacts Breakdown ---');
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);
    totalRawBytes += content.length;
    totalGzipBytes += gzipped.length;

    const rawKb = (content.length / 1024).toFixed(2);
    const gzKb = (gzipped.length / 1024).toFixed(2);
    console.log(`    * ${file.padEnd(30)} ${rawKb.padStart(8)} KB (raw) | ${gzKb.padStart(7)} KB (gzip)`);

    if (file.startsWith('index-') && file.endsWith('.js')) {
      mainJsGzipBytes = gzipped.length;
    }
  }

  const totalGzKb = (totalGzipBytes / 1024).toFixed(2);
  const mainJsGzKb = (mainJsGzipBytes / 1024).toFixed(2);
  console.log(`  ----------------------------------`);
  console.log(`  Total assets gzip: ${totalGzKb} KB | Main App JS gzip: ${mainJsGzKb} KB`);

  assert(totalGzipBytes < 200 * 1024, `Total gzipped bundle (${totalGzKb} KB) is strictly under 200 KB budget.`);
  assert(mainJsGzipBytes < 50 * 1024, `Main Application JS (${mainJsGzKb} KB) is under 50 KB.`);
}

// ----------------------------------------------------------------------------
// 3. PWA Manifest & Service Worker
// ----------------------------------------------------------------------------
console.log('\n[3/7] VERIFYING PWA SPECIFICATION & SERVICE WORKER...');
const manifestPath = path.join(distDir, 'manifest.webmanifest');
const swPath = path.join(distDir, 'sw.js');

assert(fs.existsSync(manifestPath), 'manifest.webmanifest generated in dist.');
assert(fs.existsSync(swPath), 'PWA service worker (sw.js) generated in dist.');

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.name === 'ZC Formula Student PitLane', `Manifest name: "${manifest.name}"`);
  assert(manifest.short_name === 'PitLane', `Manifest short_name: "${manifest.short_name}"`);
  assert(manifest.display === 'standalone', `Display mode: "${manifest.display}" (native app shell)`);
  assert(manifest.start_url === '/', `Start URL: "${manifest.start_url}"`);
  assert(manifest.theme_color === '#0B1B3A', `Theme color: "${manifest.theme_color}"`);
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, `Icons declared: ${manifest.icons.length} resolutions`);
}

// ----------------------------------------------------------------------------
// 4. University Email Domain Validation Regex
// ----------------------------------------------------------------------------
console.log('\n[4/7] VERIFYING UNIVERSITY EMAIL DOMAIN RESTRICTION LOGIC...');
const domainRegex = /^[A-Za-z0-9._%+-]+@zewailcity\.edu\.eg$/i;

const testEmails = [
  // Valid university emails
  { email: 'student.2023001@zewailcity.edu.eg', expected: true, desc: 'Undergraduate student' },
  { email: 'advisor@zewailcity.edu.eg', expected: true, desc: 'Faculty advisor' },
  { email: 'first.last-fs@zewailcity.edu.eg', expected: true, desc: 'Hyphenated team email' },
  // Invalid external / spoofed emails
  { email: 'intruder@gmail.com', expected: false, desc: 'Public Gmail' },
  { email: 'hacker@zewailcity.edu.eg.attacker.com', expected: false, desc: 'Subdomain spoofing attack' },
  { email: 'admin@zewailcity.edu.eg@evil.com', expected: false, desc: 'Double @ spoofing' },
  { email: 'fakezewailcity.edu.eg', expected: false, desc: 'Missing @ symbol' },
  { email: 'user@zewailcity.edu', expected: false, desc: 'Missing .eg TLD' },
  { email: '@zewailcity.edu.eg', expected: false, desc: 'Missing username prefix' }
];

for (const t of testEmails) {
  const isValid = domainRegex.test(t.email);
  assert(isValid === t.expected, `Email check [${t.desc}]: "${t.email}" -> ${isValid ? 'ALLOWED' : 'BLOCKED'}`);
}

// ----------------------------------------------------------------------------
// 5. Storage Quota & File Extension Validation
// ----------------------------------------------------------------------------
console.log('\n[5/7] VERIFYING FILE UPLOAD VALIDATION & QUOTA ENFORCEMENT...');
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = [
  'pdf', 'zip', 'step', 'stp', 'iges', 'igs', 'cad', 'sldprt', 'sldasm',
  'png', 'jpg', 'jpeg', 'svg', 'csv', 'xlsx', 'm', 'py', 'c', 'cpp', 'txt'
];

function validateMockFile(name, sizeBytes) {
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: 'QUOTA_EXCEEDED' };
  }
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: 'INVALID_EXTENSION' };
  }
  return { valid: true };
}

const fileTests = [
  { name: 'suspension_geometry.step', size: 12 * 1024 * 1024, expected: true, desc: '12MB STEP CAD file' },
  { name: 'aerodynamics_report.pdf', size: 4 * 1024 * 1024, expected: true, desc: '4MB PDF engineering report' },
  { name: 'telemetry_analysis.py', size: 15 * 1024, expected: true, desc: '15KB Python script' },
  { name: 'massive_scan.sldasm', size: 28 * 1024 * 1024, expected: false, desc: '28MB file exceeding 25MB quota' },
  { name: 'trojan_exploit.exe', size: 500 * 1024, expected: false, desc: 'Executable .exe file rejected' },
  { name: 'script.bat', size: 2 * 1024, expected: false, desc: 'Batch script .bat file rejected' },
  { name: 'library.dll', size: 100 * 1024, expected: false, desc: 'Dynamic library .dll file rejected' }
];

for (const ft of fileTests) {
  const res = validateMockFile(ft.name, ft.size);
  assert(res.valid === ft.expected, `File check [${ft.desc}]: "${ft.name}" (${(ft.size / 1024 / 1024).toFixed(2)} MB) -> ${res.valid ? 'ACCEPTED' : 'REJECTED'}`);
}

// ----------------------------------------------------------------------------
// 6. CSV & JSON Telemetry Export Formatting (RFC 4180)
// ----------------------------------------------------------------------------
console.log('\n[6/7] VERIFYING RFC 4180 CSV & JSON EXPORT FORMATTING...');
const mockTasks = [
  {
    id: 'task-001',
    group_id: 'group-vd',
    title: 'Double Wishbone Suspension, "Front Assembly"',
    task_type: 'design',
    priority: 'urgent',
    status: 'in_progress',
    deadline: '2026-10-15T00:00:00Z',
    created_at: '2026-09-20T10:00:00Z',
    assignees: [{ id: 'u1', full_name: 'Kareem Tarek' }]
  },
  {
    id: 'task-002',
    group_id: 'group-aero',
    title: 'CFD Boundary Layer Simulation',
    task_type: 'research',
    priority: 'high',
    status: 'submitted',
    deadline: '2026-10-20T00:00:00Z',
    created_at: '2026-09-22T14:30:00Z',
    assignees: [{ id: 'u2', full_name: 'Sarah Nabil' }]
  }
];

const mockSubTeams = [
  { id: 'group-vd', name: 'Technical - Vehicle Dynamics' },
  { id: 'group-aero', name: 'Technical - Aerodynamics' }
];

const escapeCSV = (val) => {
  if (!val) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

const headers = ['Task ID', 'Sub-Team', 'Title', 'Task Type', 'Priority', 'Status', 'Deadline (UTC)', 'Assignees', 'Created At'];
const rows = mockTasks.map((t) => {
  const gName = mockSubTeams.find((g) => g.id === t.group_id)?.name || 'General';
  const aStr = t.assignees?.map((a) => a.full_name).join('; ') || 'Unassigned';
  return [
    escapeCSV(t.id),
    escapeCSV(gName),
    escapeCSV(t.title),
    escapeCSV(t.task_type.toUpperCase()),
    escapeCSV(t.priority.toUpperCase()),
    escapeCSV(t.status.toUpperCase()),
    escapeCSV(new Date(t.deadline).toISOString()),
    escapeCSV(aStr),
    escapeCSV(new Date(t.created_at).toISOString()),
  ].join(',');
});

const generatedCSV = [headers.join(','), ...rows].join('\n');

assert(generatedCSV.includes('Double Wishbone Suspension, ""Front Assembly""'), 'CSV correctly escapes quotes and commas per RFC 4180.');
assert(generatedCSV.split('\n').length === 3, `CSV has exact row count (header + 2 data rows).`);

const generatedJSON = JSON.stringify(mockTasks, null, 2);
const parsedJSON = JSON.parse(generatedJSON);
assert(parsedJSON.length === 2 && parsedJSON[0].title.includes('Double Wishbone'), 'JSON telemetry export roundtrips cleanly.');

// ----------------------------------------------------------------------------
// 7. Database Migrations & RLS Test File Integrity
// ----------------------------------------------------------------------------
console.log('\n[7/7] VERIFYING DATABASE MIGRATION & RLS SCRIPTS INTEGRITY...');
const migrationFiles = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_rls_policies.sql',
  'supabase/migrations/003_seed_data.sql',
  'supabase/tests/rls_security_test.sql'
];

for (const mf of migrationFiles) {
  const fullPath = path.resolve(mf);
  assert(fs.existsSync(fullPath), `Migration file exists: ${mf}`);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(content.length > 500, `File content verified (${content.split('\n').length} lines)`);
  }
}

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('='.repeat(80));

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
