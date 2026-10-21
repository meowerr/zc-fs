import sharp from 'sharp';
import fs from 'fs';

async function main() {
  const zfs = fs.readFileSync('src/components/brand/ZfsLogo.tsx', 'utf8');
  const monoAccentMatch = zfs.match(/const MONO_ACCENT_PATH =\s*"([^"]+)"/);
  const monoAccentPath = monoAccentMatch[1];

  const light = fs.readFileSync('src/assets/brand/lightPaths.ts', 'utf8');
  const lightMonoMatch = light.match(/LIGHT_MONO_BODY_PATH = "([^"]+)"/);
  const lightMonoBody = lightMonoMatch[1];

  const lightAccentMatch = light.match(/LIGHT_FULL_ACCENT_PATH = "([^"]+)"/);
  const lightAccentPath = lightAccentMatch[1];

  fs.mkdirSync('scratch', { recursive: true });

  // 1. Using dark mode MONO_ACCENT_PATH on light body
  const svgA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 560"><path fill="#070B0E" fill-rule="evenodd" d="${lightMonoBody}"/><path fill="#C2410C" fill-rule="evenodd" d="${monoAccentPath}"/></svg>`;
  await sharp(Buffer.from(svgA)).resize(800).png().toFile('scratch/test_align_mono.png');

  // 2. Using light mode LIGHT_FULL_ACCENT_PATH on light body
  const svgB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 560"><path fill="#070B0E" fill-rule="evenodd" d="${lightMonoBody}"/><path fill="#C2410C" fill-rule="evenodd" d="${lightAccentPath}"/></svg>`;
  await sharp(Buffer.from(svgB)).resize(800).png().toFile('scratch/test_align_light.png');

  console.log('Saved comparison images in scratch/');
}

main().catch(console.error);
