import sharp from 'sharp';
import potrace from 'potrace';
import fs from 'fs';
import path from 'path';
import { optimize } from 'svgo';

const BRAND_BLACK_SOURCE = 'brand-source/zfs-logo-black.jpg';
const ASSETS_BRAND_DIR = 'src/assets/brand';

function traceBitmap(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    potrace.trace(
      buffer,
      {
        turdSize: 20,
        optTolerance: 0.8,
        turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
        alphaMax: 1.0,
        optCurve: true,
        ...options,
      },
      (err, svg) => (err ? reject(err) : resolve(svg))
    );
  });
}

function extractPaths(svgString) {
  const match = svgString.match(/<path[^>]*d="([^"]+)"/g);
  if (!match) return '';
  return match.map((m) => m.match(/d="([^"]+)"/)[1]).join(' ');
}

function optimizeSvg(svgStr) {
  return optimize(svgStr, {
    multipass: true,
    floatPrecision: 0,
    plugins: [
      'preset-default',
      { name: 'removeViewBox', active: false },
      { name: 'cleanupNumericValues', params: { floatPrecision: 0 } },
      { name: 'convertPathData', params: { floatPrecision: 0, transformPrecision: 0 } },
      { name: 'cleanupIds', active: false },
    ],
  }).data;
}

async function run() {
  console.log('🏎️  Tracing Light-Mode ZFS Assets from zfs-logo-black.jpg...');

  const cropBox = { left: 160, top: 380, width: 2180, height: 1120 };
  const workingWidth = 2000;
  const workingHeight = Math.round((1120 * 2000) / 2180); // 1028

  const cropped = sharp(BRAND_BLACK_SOURCE).extract(cropBox).resize(workingWidth, workingHeight);
  const { data: rawPixels, info } = await cropped.raw().toBuffer({ resolveWithObject: true });

  const fullBlackMask = Buffer.alloc(info.width * info.height);
  const fullOrangeMask = Buffer.alloc(info.width * info.height);
  const compactBlackMask = Buffer.alloc(info.width * info.height);
  const compactOrangeMask = Buffer.alloc(info.width * info.height);
  const monoBlackMask = Buffer.alloc(info.width * info.height);
  const monoOrangeMask = Buffer.alloc(info.width * info.height);

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = rawPixels[idx];
      const g = rawPixels[idx + 1];
      const b = rawPixels[idx + 2];
      const pIdx = y * info.width + x;

      const isOrange = r > 130 && g > 50 && g < 150 && b < 60 && (r - g) > 25;
      const isBlack = !isOrange && r < 95 && g < 95 && b < 95;

      fullBlackMask[pIdx] = isBlack ? 0 : 255;
      fullOrangeMask[pIdx] = isOrange ? 0 : 255;

      if (y < 850) {
        compactBlackMask[pIdx] = isBlack ? 0 : 255;
        compactOrangeMask[pIdx] = isOrange ? 0 : 255;
      } else {
        compactBlackMask[pIdx] = 255;
        compactOrangeMask[pIdx] = 255;
      }

      if (y < 560) {
        monoBlackMask[pIdx] = isBlack ? 0 : 255;
        monoOrangeMask[pIdx] = isOrange ? 0 : 255;
      } else {
        monoBlackMask[pIdx] = 255;
        monoOrangeMask[pIdx] = 255;
      }
    }
  }

  const [
    fullBlackPng, fullOrangePng,
    compactBlackPng, compactOrangePng,
    monoBlackPng, monoOrangePng
  ] = await Promise.all([
    sharp(fullBlackMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(fullOrangeMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(compactBlackMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(compactOrangeMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(monoBlackMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(monoOrangeMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
  ]);

  const [
    fullBlackSvg, fullOrangeSvg,
    compactBlackSvg, compactOrangeSvg,
    monoBlackSvg, monoOrangeSvg
  ] = await Promise.all([
    traceBitmap(fullBlackPng, { turdSize: 20, optTolerance: 0.8 }),
    traceBitmap(fullOrangePng, { turdSize: 25, optTolerance: 0.85 }),
    traceBitmap(compactBlackPng, { turdSize: 20, optTolerance: 0.8 }),
    traceBitmap(compactOrangePng, { turdSize: 25, optTolerance: 0.85 }),
    traceBitmap(monoBlackPng, { turdSize: 15, optTolerance: 0.75 }),
    traceBitmap(monoOrangePng, { turdSize: 20, optTolerance: 0.8 }),
  ]);

  const fullBlackPath = extractPaths(fullBlackSvg);
  const fullOrangePath = extractPaths(fullOrangeSvg);
  const compactBlackPath = extractPaths(compactBlackSvg);
  const compactOrangePath = extractPaths(compactOrangeSvg);
  const monoBlackPath = extractPaths(monoBlackSvg);
  const monoOrangePath = extractPaths(monoOrangeSvg);

  const fullLightSvg = optimizeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${info.width} ${info.height}" role="img" aria-label="Zewail Formula Team">
  <path d="${fullBlackPath}" fill="var(--logo-body, #070B0E)" fill-rule="evenodd"/>
  <path d="${fullOrangePath}" fill="var(--logo-accent, #C2410C)" fill-rule="evenodd"/>
</svg>
  `.trim());

  const compactLightSvg = optimizeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${info.width} 850" role="img" aria-label="Zewail Formula Team PitLane">
  <path d="${compactBlackPath}" fill="var(--logo-body, #070B0E)" fill-rule="evenodd"/>
  <path d="${compactOrangePath}" fill="var(--logo-accent, #C2410C)" fill-rule="evenodd"/>
</svg>
  `.trim());

  const monoLightSvg = optimizeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${info.width} 560" role="img" aria-label="ZFS">
  <path d="${monoBlackPath}" fill="var(--logo-body, #070B0E)" fill-rule="evenodd"/>
  <path d="${monoOrangePath}" fill="var(--logo-accent, #C2410C)" fill-rule="evenodd"/>
</svg>
  `.trim());

  fs.writeFileSync(path.join(ASSETS_BRAND_DIR, 'ZfsLightModeLogo.svg'), fullLightSvg);
  fs.writeFileSync(path.join(ASSETS_BRAND_DIR, 'ZfsLightModeHorizontal.svg'), compactLightSvg);
  fs.writeFileSync(path.join(ASSETS_BRAND_DIR, 'ZfsLightModeMonogram.svg'), monoLightSvg);

  console.log('✅ Light mode assets generated:');
  console.log('  ZfsLightModeLogo.svg:', (Buffer.byteLength(fullLightSvg) / 1024).toFixed(1), 'KB');
  console.log('  ZfsLightModeHorizontal.svg:', (Buffer.byteLength(compactLightSvg) / 1024).toFixed(1), 'KB');
  console.log('  ZfsLightModeMonogram.svg:', (Buffer.byteLength(monoLightSvg) / 1024).toFixed(1), 'KB');

  // Also export extracted path strings for ZfsLogo.tsx
  fs.writeFileSync(
    'src/assets/brand/lightPaths.json',
    JSON.stringify({
      viewBox: `0 0 ${info.width} ${info.height}`,
      fullBlackPath,
      fullOrangePath,
      compactBlackPath,
      compactOrangePath,
      monoBlackPath,
      monoOrangePath,
    })
  );
  console.log('Exported lightPaths.json');
}

run().catch(console.error);
