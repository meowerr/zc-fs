import fs from 'fs';

const content = fs.readFileSync('src/assets/brand/lightPaths.ts', 'utf8');

function cleanPath(p, minLen = 40) {
  const subpaths = p.split(/(?=[Mm])/);
  // Keep subpaths that are not tiny speckles
  const major = subpaths.filter(sp => sp.length >= minLen);
  return major.join('');
}

const monoBody = content.match(/LIGHT_MONO_BODY_PATH = "([^"]+)"/)[1];
const horizSuffix = content.match(/LIGHT_HORIZ_BODY_SUFFIX = "([^"]+)"/)[1];
const fullSuffix = content.match(/LIGHT_FULL_BODY_SUFFIX = "([^"]+)"/)[1];
const accent = content.match(/LIGHT_FULL_ACCENT_PATH = "([^"]+)"/)[1];

const cleanMonoBody = cleanPath(monoBody, 40);
const cleanHorizSuffix = cleanPath(horizSuffix, 40);
const cleanFullSuffix = cleanPath(fullSuffix, 40);
const cleanAccent = cleanPath(accent, 70);

console.log('monoBody:', monoBody.length, '->', cleanMonoBody.length);
console.log('horizSuffix:', horizSuffix.length, '->', cleanHorizSuffix.length);
console.log('fullSuffix:', fullSuffix.length, '->', cleanFullSuffix.length);
console.log('accent:', accent.length, '->', cleanAccent.length);

const out = `// Light-mode ZFS vector paths optimized
export const LIGHT_MONO_BODY_PATH = "${cleanMonoBody}";
const LIGHT_HORIZ_BODY_SUFFIX = "${cleanHorizSuffix}";
export const LIGHT_HORIZ_BODY_PATH = LIGHT_MONO_BODY_PATH + LIGHT_HORIZ_BODY_SUFFIX;
const LIGHT_FULL_BODY_SUFFIX = "${cleanFullSuffix}";
export const LIGHT_FULL_BODY_PATH = LIGHT_MONO_BODY_PATH + LIGHT_FULL_BODY_SUFFIX;

export const LIGHT_FULL_ACCENT_PATH = "${cleanAccent}";
export const LIGHT_HORIZ_ACCENT_PATH = LIGHT_FULL_ACCENT_PATH;
export const LIGHT_MONO_ACCENT_PATH = LIGHT_FULL_ACCENT_PATH;
`;

fs.writeFileSync('src/assets/brand/lightPaths.ts', out);
console.log('Saved optimized lightPaths.ts');
