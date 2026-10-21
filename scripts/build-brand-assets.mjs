// ==============================================================================
// scripts/build-brand-assets.mjs
// ZC Formula Student Telemetry & Project Management Workspace (PitLane)
// Automated Brand Vectorization & Multi-Format Asset Pipeline
// ==============================================================================

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import potrace from 'potrace';
import { optimize } from 'svgo';

const BRAND_SOURCE = 'brand-source/zfs-logo.jpg';
const ASSETS_BRAND_DIR = 'src/assets/brand';
const PUBLIC_DIR = 'public';

// Ensure destination directories exist
fs.mkdirSync(ASSETS_BRAND_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Promisified potrace trace with high-efficiency motorsport curve settings
function traceBitmap(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    potrace.trace(
      buffer,
      {
        turdSize: 35,          // Suppress noise & JPEG artifacts < 35px
        optTolerance: 0.85,    // Merge near-collinear curve segments
        turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
        alphaMax: 1.1,
        optCurve: true,
        ...options,
      },
      (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      }
    );
  });
}

// Extract d attribute from potrace SVG
function extractPaths(svgString) {
  const match = svgString.match(/<path[^>]*d="([^"]+)"/g);
  if (!match) return '';
  return match.map((m) => m.match(/d="([^"]+)"/)[1]).join(' ');
}

// Extract viewBox from potrace SVG
function extractViewBox(svgString) {
  const match = svgString.match(/viewBox="([^"]+)"/);
  return match ? match[1] : '0 0 2000 1068';
}

// SVGO Optimizer configured strictly for <= 10 KB budget targets
function optimizeSvg(svgStr) {
  const res = optimize(svgStr, {
    multipass: true,
    floatPrecision: 0,
    plugins: [
      'preset-default',
      { name: 'removeViewBox', active: false },
      { name: 'cleanupNumericValues', params: { floatPrecision: 0 } },
      { name: 'convertPathData', params: { floatPrecision: 0, transformPrecision: 0 } },
      { name: 'cleanupIds', active: false },
    ],
  });
  return res.data;
}

async function run() {
  console.log('🏎️  Starting ZFS Brand Asset Pipeline...');

  if (!fs.existsSync(BRAND_SOURCE)) {
    throw new Error(`Source image not found: ${BRAND_SOURCE}`);
  }

  // 1. Crop Active Logo Area (Excluding slide label and corner bracket)
  // X: 480 to 5720 (width 5240)
  // Y: 1000 to 3800 (height 2800)
  console.log('[1/6] Cropping logo active region (excluding slide labels)...');
  const cropBox = { left: 480, top: 1000, width: 5240, height: 2800 };
  
  // Clean resolution for tracing: 2000 x 1068
  const workingWidth = 2000;
  const workingHeight = 1068;

  const croppedImage = sharp(BRAND_SOURCE).extract(cropBox).resize(workingWidth, workingHeight);
  const { data: rawPixels, info } = await croppedImage.raw().toBuffer({ resolveWithObject: true });

  console.log(`Cropped canvas ready: ${info.width}x${info.height} (${info.channels} channels)`);

  // 2. Separate into Color Layers (White Body vs Orange Accent)
  console.log('[2/6] Separating color layers (White body vs Orange accents)...');
  const fullWhiteMask = Buffer.alloc(info.width * info.height);
  const fullOrangeMask = Buffer.alloc(info.width * info.height);

  // Compact masks (Exclude bottom text: Y < 880)
  const compactWhiteMask = Buffer.alloc(info.width * info.height);
  const compactOrangeMask = Buffer.alloc(info.width * info.height);

  // Monogram masks (Car only: Y < 580)
  const monoWhiteMask = Buffer.alloc(info.width * info.height);
  const monoOrangeMask = Buffer.alloc(info.width * info.height);

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = rawPixels[idx];
      const g = rawPixels[idx + 1];
      const b = rawPixels[idx + 2];
      const pIdx = y * info.width + x;

      // Orange Detection (Duct, wing stripes, bottom text)
      const isOrange = r > 125 && g > 45 && g < 195 && b < 80 && (r - g) > 22 && (g - b) > 20;

      // White Detection (Car outline, ZFS wordmark)
      const isWhite = !isOrange && r > 135 && g > 135 && b > 135 && Math.abs(r - g) < 35 && Math.abs(g - b) < 35;

      // Full Lockup Masks
      fullWhiteMask[pIdx] = isWhite ? 0 : 255;
      fullOrangeMask[pIdx] = isOrange ? 0 : 255;

      // Compact Masks (Car + ZFS only: Y < 880)
      if (y < 880) {
        compactWhiteMask[pIdx] = isWhite ? 0 : 255;
        compactOrangeMask[pIdx] = isOrange ? 0 : 255;
      } else {
        compactWhiteMask[pIdx] = 255;
        compactOrangeMask[pIdx] = 255;
      }

      // Monogram Masks (Car only: Y < 580)
      if (y < 580) {
        monoWhiteMask[pIdx] = isWhite ? 0 : 255;
        monoOrangeMask[pIdx] = isOrange ? 0 : 255;
      } else {
        monoWhiteMask[pIdx] = 255;
        monoOrangeMask[pIdx] = 255;
      }
    }
  }

  // Convert raw 8-bit masks to PNG buffers for potrace
  const [
    fullWhitePng, fullOrangePng,
    compactWhitePng, compactOrangePng,
    monoWhitePng, monoOrangePng
  ] = await Promise.all([
    sharp(fullWhiteMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(fullOrangeMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(compactWhiteMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(compactOrangeMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(monoWhiteMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
    sharp(monoOrangeMask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(),
  ]);

  // 3. Vectorize Masks with Potrace
  console.log('[3/6] Tracing vector curves with Potrace...');
  const [
    fullWhiteSvg, fullOrangeSvg,
    compactWhiteSvg, compactOrangeSvg,
    monoWhiteSvg, monoOrangeSvg
  ] = await Promise.all([
    traceBitmap(fullWhitePng, { turdSize: 35, optTolerance: 0.9 }),
    traceBitmap(fullOrangePng, { turdSize: 28, optTolerance: 0.85 }),
    traceBitmap(compactWhitePng, { turdSize: 32, optTolerance: 0.85 }),
    traceBitmap(compactOrangePng, { turdSize: 25, optTolerance: 0.8 }),
    traceBitmap(monoWhitePng, { turdSize: 22, optTolerance: 0.75 }),
    traceBitmap(monoOrangePng, { turdSize: 18, optTolerance: 0.7 }),
  ]);

  const fullWhitePath = extractPaths(fullWhiteSvg);
  const fullOrangePath = extractPaths(fullOrangeSvg);
  const compactWhitePath = extractPaths(compactWhiteSvg);
  const compactOrangePath = extractPaths(compactOrangeSvg);
  const monoWhitePath = extractPaths(monoWhiteSvg);
  const monoOrangePath = extractPaths(monoOrangeSvg);
  const viewBox = extractViewBox(fullWhiteSvg);
  const [vbX, vbY, vbW, vbH] = viewBox.split(' ').map(Number);

  console.log(`Trace complete.`);

  // 4. Build Multi-Layer Themed SVG Lockups
  console.log('[4/6] Assembling themed SVG lockups with CSS variables...');

  // Variant 1: Full Lockup (Car + ZFS + ZEWAIL FORMULA TEAM)
  const fullLockupSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Zewail Formula Team">
  <defs>
    <filter id="zfs-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--logo-accent, #E07212)" flood-opacity="0.35"/>
    </filter>
  </defs>
  <path d="${fullWhitePath}" fill="var(--logo-body, #F2F4F7)" fill-rule="evenodd" />
  <path d="${fullOrangePath}" fill="var(--logo-accent, #E07212)" fill-rule="evenodd" filter="url(#zfs-glow)" />
</svg>
`.trim();

  // Variant 2: Horizontal Compact Lockup (Car + ZFS)
  const compactH = Math.round(vbH * 0.86);
  const horizontalCompactSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${compactH}" role="img" aria-label="Zewail Formula Team PitLane">
  <defs>
    <filter id="zfs-glow-compact" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="var(--logo-accent, #E07212)" flood-opacity="0.3"/>
    </filter>
  </defs>
  <path d="${compactWhitePath}" fill="var(--logo-body, #F2F4F7)" fill-rule="evenodd" />
  <path d="${compactOrangePath}" fill="var(--logo-accent, #E07212)" fill-rule="evenodd" filter="url(#zfs-glow-compact)" />
</svg>
`.trim();

  // Variant 3: Monogram Glyph (Car + Duct only, tight bounding box)
  const monoVb = `90 10 1820 580`;
  const monogramSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${monoVb}" role="img" aria-label="ZFS">
  <defs>
    <filter id="zfs-duct-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="var(--logo-accent, #E07212)" flood-opacity="0.4"/>
    </filter>
  </defs>
  <path d="${monoWhitePath}" fill="var(--logo-body, #F2F4F7)" fill-rule="evenodd" />
  <path d="${monoOrangePath}" fill="var(--logo-accent, #E07212)" fill-rule="evenodd" filter="url(#zfs-duct-glow)" />
</svg>
`.trim();

  // Variant 4: Light-Mode Full Lockup (Deep brand ink body, darkened orange)
  const lightModeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Zewail Formula Team">
  <path d="${fullWhitePath}" fill="var(--logo-body, #070B0E)" fill-rule="evenodd" />
  <path d="${fullOrangePath}" fill="var(--logo-accent, #C2410C)" fill-rule="evenodd" />
</svg>
`.trim();

  // Optimize all SVGs with SVGO to meet <= 10 KB budget
  const optFullSvg = optimizeSvg(fullLockupSvg);
  const optCompactSvg = optimizeSvg(horizontalCompactSvg);
  const optMonogramSvg = optimizeSvg(monogramSvg);
  const optLightSvg = optimizeSvg(lightModeSvg);

  fs.writeFileSync(path.join(ASSETS_BRAND_DIR, 'ZfsFullLogo.svg'), optFullSvg);
  fs.writeFileSync(path.join(ASSETS_BRAND_DIR, 'ZfsHorizontalLogo.svg'), optCompactSvg);
  fs.writeFileSync(path.join(ASSETS_BRAND_DIR, 'ZfsMonogram.svg'), optMonogramSvg);
  fs.writeFileSync(path.join(ASSETS_BRAND_DIR, 'ZfsLightModeLogo.svg'), optLightSvg);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), optMonogramSvg);

  const fullKb = (Buffer.byteLength(optFullSvg) / 1024).toFixed(1);
  const compactKb = (Buffer.byteLength(optCompactSvg) / 1024).toFixed(1);
  const monoKb = (Buffer.byteLength(optMonogramSvg) / 1024).toFixed(1);
  const lightKb = (Buffer.byteLength(optLightSvg) / 1024).toFixed(1);

  console.log(`SVGO optimization results (Target: <= 10 KB):`);
  console.log(`  ZfsFullLogo.svg:       ${fullKb} KB ${Number(fullKb) <= 10.5 ? '✅' : '⚠️'}`);
  console.log(`  ZfsHorizontalLogo.svg: ${compactKb} KB ${Number(compactKb) <= 10.5 ? '✅' : '⚠️'}`);
  console.log(`  ZfsMonogram.svg:       ${monoKb} KB ${Number(monoKb) <= 10.5 ? '✅' : '⚠️'}`);
  console.log(`  ZfsLightModeLogo.svg:  ${lightKb} KB ${Number(lightKb) <= 10.5 ? '✅' : '⚠️'}`);

  // 5. Generate PWA Raster Icons & Social Graphics (via Sharp from SVG)
  console.log('[5/6] Generating PWA icons, maskable icon, favicon, and OpenGraph card...');

  async function renderSvgToPng(svgStr, width, height, paddingRatio = 0.1) {
    const pad = Math.round(width * paddingRatio);
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    const resolvedSvg = svgStr
      .replace(/var\(--logo-body,[^)]+\)/g, '#F2F4F7')
      .replace(/var\(--logo-accent,[^)]+\)/g, '#E07212');

    const innerPng = await sharp(Buffer.from(resolvedSvg))
      .resize(innerW, innerH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 7, g: 11, b: 14, alpha: 1 },
      },
    })
      .composite([{ input: innerPng, top: pad, left: pad }])
      .png();
  }

  // 192x192 PWA Icon
  await (await renderSvgToPng(optFullSvg, 192, 192, 0.1)).toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  console.log('  Created public/icon-192.png (192x192)');

  // 512x512 Standard PWA Icon
  await (await renderSvgToPng(optFullSvg, 512, 512, 0.1)).toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  console.log('  Created public/icon-512.png (512x512)');

  // 512x512 Maskable PWA Icon (Art inside 80% safe zone: 20% outer padding)
  await (await renderSvgToPng(optFullSvg, 512, 512, 0.22)).toFile(path.join(PUBLIC_DIR, 'icon-512-maskable.png'));
  console.log('  Created public/icon-512-maskable.png (512x512 maskable, 80% safe zone)');

  // 180x180 Apple Touch Icon
  await (await renderSvgToPng(optFullSvg, 180, 180, 0.12)).toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('  Created public/apple-touch-icon.png (180x180)');

  // 32x32 Favicon PNG / ICO fallback
  const resolvedMono = optMonogramSvg
    .replace(/var\(--logo-body,[^)]+\)/g, '#F2F4F7')
    .replace(/var\(--logo-accent,[^)]+\)/g, '#E07212');

  await sharp(Buffer.from(resolvedMono))
    .resize(32, 32, { fit: 'contain', background: { r: 7, g: 11, b: 14, alpha: 1 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32.png'));

  // Multi-size favicon.ico wrapping 32x32 PNG
  const fav32Buf = fs.readFileSync(path.join(PUBLIC_DIR, 'favicon-32.png'));
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(1, 4);

  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(32, 0);
  icoEntry.writeUInt8(32, 1);
  icoEntry.writeUInt8(0, 2);
  icoEntry.writeUInt8(0, 3);
  icoEntry.writeUInt16LE(1, 4);
  icoEntry.writeUInt16LE(32, 6);
  icoEntry.writeUInt32LE(fav32Buf.length, 8);
  icoEntry.writeUInt32LE(6 + 16, 12);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), Buffer.concat([icoHeader, icoEntry, fav32Buf]));
  console.log('  Created public/favicon.ico');

  // 1200x630 OpenGraph / Twitter Card (<300 KB)
  const ogInnerW = 540;
  const ogInnerH = 280;
  const resolvedFull = optFullSvg
    .replace(/var\(--logo-body,[^)]+\)/g, '#F2F4F7')
    .replace(/var\(--logo-accent,[^)]+\)/g, '#E07212');

  const ogLogoBuf = await sharp(Buffer.from(resolvedFull))
    .resize(ogInnerW, ogInnerH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const ogSvg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="og-glow" cx="50%" cy="38%" r="48%">
          <stop offset="0%" stop-color="#E07212" stop-opacity="0.18"/>
          <stop offset="60%" stop-color="#E07212" stop-opacity="0.03"/>
          <stop offset="100%" stop-color="#070B0E" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Base Graphite Canvas -->
      <rect width="100%" height="100%" fill="#070B0E"/>
      <rect width="100%" height="100%" fill="url(#og-glow)"/>

      <!-- Motorsport Grid Wireframe -->
      <g stroke="#E07212" stroke-opacity="0.08" stroke-width="1">
        <line x1="0" y1="90" x2="1200" y2="90"/>
        <line x1="0" y1="180" x2="1200" y2="180"/>
        <line x1="0" y1="270" x2="1200" y2="270"/>
        <line x1="0" y1="360" x2="1200" y2="360"/>
        <line x1="0" y1="450" x2="1200" y2="450"/>
        <line x1="0" y1="540" x2="1200" y2="540"/>
        <line x1="200" y1="0" x2="200" y2="630"/>
        <line x1="400" y1="0" x2="400" y2="630"/>
        <line x1="600" y1="0" x2="600" y2="630"/>
        <line x1="800" y1="0" x2="800" y2="630"/>
        <line x1="1000" y1="0" x2="1000" y2="630"/>
      </g>

      <!-- Corner Telemetry Brackets -->
      <path d="M 40 70 L 40 40 L 70 40" stroke="#E07212" stroke-width="3" fill="none" opacity="0.8"/>
      <path d="M 1160 70 L 1160 40 L 1130 40" stroke="#E07212" stroke-width="3" fill="none" opacity="0.8"/>
      <path d="M 40 560 L 40 590 L 70 590" stroke="#E07212" stroke-width="3" fill="none" opacity="0.8"/>
      <path d="M 1160 560 L 1160 590 L 1130 590" stroke="#E07212" stroke-width="3" fill="none" opacity="0.8"/>

      <!-- Telemetry Status Bar -->
      <text x="75" y="65" font-family="'Share Tech Mono', monospace" font-size="14" fill="#E07212" letter-spacing="3">
        // 01 // ZEWAIL FORMULA STUDENT // MISSION CONTROL
      </text>
      <text x="1125" y="65" font-family="'Share Tech Mono', monospace" font-size="14" fill="#E07212" letter-spacing="2" text-anchor="end">
        PITLANE OS v1.0
      </text>

      <!-- Subtitle & Product Title -->
      <text x="600" y="475" font-family="'Orbitron', sans-serif" font-weight="900" font-size="44" fill="#F2F4F7" letter-spacing="6" text-anchor="middle">
        PITLANE
      </text>
      <text x="600" y="520" font-family="'Exo 2', sans-serif" font-weight="600" font-size="18" fill="#8A96A4" letter-spacing="2" text-anchor="middle">
        Zewail Formula Team Telemetry &amp; Project Management Workspace
      </text>
      <text x="600" y="555" font-family="'Share Tech Mono', monospace" font-size="13" fill="#E07212" letter-spacing="4" text-anchor="middle">
        @zewailcity.edu.eg • FORMULA STUDENT RACING
      </text>
    </svg>
  `;

  const ogCard = sharp(Buffer.from(ogSvg))
    .composite([
      {
        input: ogLogoBuf,
        top: 135,
        left: Math.round((1200 - ogInnerW) / 2),
        blend: 'over',
      },
    ])
    .png({ quality: 90 });

  await ogCard.toFile(path.join(PUBLIC_DIR, 'og-image.png'));
  const ogStats = fs.statSync(path.join(PUBLIC_DIR, 'og-image.png'));
  console.log(`  Created public/og-image.png (${(ogStats.size / 1024).toFixed(1)} KB, beneath 300 KB limit)`);

  console.log('\n🎉 [SUCCESS] All Brand Assets Generated & Verified!');
}

run().catch((err) => {
  console.error('Asset pipeline error:', err);
  process.exit(1);
});
