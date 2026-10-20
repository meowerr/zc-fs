import sharp from 'sharp';
import potrace from 'potrace';
import fs from 'fs';
import { optimize } from 'svgo';

async function testTraceBlackLogo() {
  const cropBox = { left: 160, top: 380, width: 2180, height: 1120 };
  const workingW = 2000;
  const workingH = Math.round((1120 * 2000) / 2180); // ~1028

  const cropped = sharp('brand-source/zfs-logo-black.jpg').extract(cropBox).resize(workingW, workingH);
  const { data: raw, info } = await cropped.raw().toBuffer({ resolveWithObject: true });

  const blackMask = Buffer.alloc(info.width * info.height);
  const orangeMask = Buffer.alloc(info.width * info.height);

  for (let i = 0; i < info.width * info.height; i++) {
    const r = raw[i * 3];
    const g = raw[i * 3 + 1];
    const b = raw[i * 3 + 2];

    const isOrange = r > 130 && g > 50 && g < 150 && b < 60 && (r - g) > 25;
    const isBlack = !isOrange && r < 90 && g < 90 && b < 90;

    blackMask[i] = isBlack ? 0 : 255;
    orangeMask[i] = isOrange ? 0 : 255;
  }

  const blackPng = await sharp(blackMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();
  const orangePng = await sharp(orangeMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();

  const trace = (buf, opts) => new Promise((res, rej) => potrace.trace(buf, opts, (e, s) => (e ? rej(e) : res(s))));

  const [blackSvg, orangeSvg] = await Promise.all([
    trace(blackPng, { turdSize: 20, optTolerance: 0.8 }),
    trace(orangePng, { turdSize: 25, optTolerance: 0.85 }),
  ]);

  const extractPaths = (svg) =>
    (svg.match(/<path[^>]*d="([^"]+)"/g) || []).map((m) => m.match(/d="([^"]+)"/)[1]).join(' ');

  const blackPath = extractPaths(blackSvg);
  const orangePath = extractPaths(orangeSvg);

  const combinedSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${info.width} ${info.height}" role="img" aria-label="Zewail Formula Team">
  <path d="${blackPath}" fill="var(--logo-body, #070B0E)" fill-rule="evenodd"/>
  <path d="${orangePath}" fill="var(--logo-accent, #C2410C)" fill-rule="evenodd"/>
</svg>
`.trim();

  const optSvg = optimize(combinedSvg, {
    multipass: true,
    floatPrecision: 0,
    plugins: ['preset-default', { name: 'removeViewBox', active: false }],
  }).data;

  fs.writeFileSync('scratch_light_logo_test.svg', optSvg);
  await sharp(Buffer.from(optSvg))
    .resize(800)
    .flatten({ background: '#FFFFFF' })
    .png()
    .toFile('scratch_light_logo_800.png');

  console.log('Light logo rendered. Size:', (Buffer.byteLength(optSvg) / 1024).toFixed(1), 'KB');
}

testTraceBlackLogo().catch(console.error);
