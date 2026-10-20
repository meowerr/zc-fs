import fs from 'fs';

const full = fs.readFileSync('src/assets/brand/ZfsLightModeLogo.svg', 'utf8');
const horiz = fs.readFileSync('src/assets/brand/ZfsLightModeHorizontal.svg', 'utf8');
const mono = fs.readFileSync('src/assets/brand/ZfsLightModeMonogram.svg', 'utf8');

const getD = (svg, idx) => {
  const matches = [...svg.matchAll(/d="([^"]+)"/g)];
  return matches[idx]?.[1] || '';
};

const fullBody = getD(full, 0);
const fullAccent = getD(full, 1);
const horizBody = getD(horiz, 0);
const horizAccent = getD(horiz, 1);
const monoBody = getD(mono, 0);
const monoAccent = getD(mono, 1);

const out = `
export const LIGHT_FULL_BODY_PATH = ${JSON.stringify(fullBody)};
export const LIGHT_FULL_ACCENT_PATH = ${JSON.stringify(fullAccent)};
export const LIGHT_HORIZ_BODY_PATH = ${JSON.stringify(horizBody)};
export const LIGHT_HORIZ_ACCENT_PATH = ${JSON.stringify(horizAccent)};
export const LIGHT_MONO_BODY_PATH = ${JSON.stringify(monoBody)};
export const LIGHT_MONO_ACCENT_PATH = ${JSON.stringify(monoAccent)};
`;

fs.writeFileSync('src/assets/brand/lightPaths.ts', out);
console.log('Saved src/assets/brand/lightPaths.ts');
