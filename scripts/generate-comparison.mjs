import sharp from 'sharp';
import fs from 'fs';

async function generateSideBySide() {
  const bg = '#070B0E';

  // 1. Original crops from brand-source/zfs-logo.jpg
  // Full logo crop: X: 480 to 5720, Y: 1000 to 3800 (w: 5240, h: 2800)
  const origFullBuf = await sharp('brand-source/zfs-logo.jpg')
    .extract({ left: 480, top: 1000, width: 5240, height: 2800 })
    .resize(600, 320, { fit: 'contain', background: bg })
    .toBuffer();

  // Compact crop (Car + ZFS): Y: 1000 to 3500 (w: 5240, h: 2500)
  const origCompactBuf = await sharp('brand-source/zfs-logo.jpg')
    .extract({ left: 480, top: 1000, width: 5240, height: 2500 })
    .resize(400, 190, { fit: 'contain', background: bg })
    .toBuffer();

  // Monogram crop (Car + Duct): Y: 1000 to 2800 (w: 5240, h: 1800)
  const origMonoBuf = await sharp('brand-source/zfs-logo.jpg')
    .extract({ left: 1600, top: 1000, width: 3200, height: 1800 })
    .resize(64, 36, { fit: 'contain', background: bg })
    .toBuffer();

  // 2. Traced SVG renders
  const fullSvg = fs.readFileSync('src/assets/brand/ZfsFullLogo.svg')
    .toString()
    .replace(/var\(--logo-body,[^)]+\)/g, '#F2F4F7')
    .replace(/var\(--logo-accent,[^)]+\)/g, '#E07212');

  const compactSvg = fs.readFileSync('src/assets/brand/ZfsHorizontalLogo.svg')
    .toString()
    .replace(/var\(--logo-body,[^)]+\)/g, '#F2F4F7')
    .replace(/var\(--logo-accent,[^)]+\)/g, '#E07212');

  const monoSvg = fs.readFileSync('src/assets/brand/ZfsMonogram.svg')
    .toString()
    .replace(/var\(--logo-body,[^)]+\)/g, '#F2F4F7')
    .replace(/var\(--logo-accent,[^)]+\)/g, '#E07212');

  const tracedFullBuf = await sharp(Buffer.from(fullSvg))
    .resize(600, 320, { fit: 'contain', background: bg })
    .toBuffer();

  const tracedCompactBuf = await sharp(Buffer.from(compactSvg))
    .resize(400, 190, { fit: 'contain', background: bg })
    .toBuffer();

  const tracedMonoBuf = await sharp(Buffer.from(monoSvg))
    .resize(64, 36, { fit: 'contain', background: bg })
    .toBuffer();

  // 3. Compose a side-by-side comparison canvas (1300 x 850)
  const canvasSvg = `
    <svg width="1300" height="850" viewBox="0 0 1300 850" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#070B0E"/>
      <text x="650" y="45" font-family="'Orbitron', sans-serif" font-size="22" font-weight="bold" fill="#F2F4F7" text-anchor="middle" letter-spacing="3">
        ZFS LOGO VECTOR TRACE FIDELITY COMPARISON
      </text>
      
      <!-- Headers -->
      <text x="340" y="90" font-family="'Orbitron', sans-serif" font-size="16" fill="#8A96A4" text-anchor="middle" letter-spacing="2">
        ORIGINAL RASTER SOURCE (SLIDE CROP)
      </text>
      <text x="960" y="90" font-family="'Orbitron', sans-serif" font-size="16" fill="#E07212" text-anchor="middle" letter-spacing="2">
        VECTOR TRACE (POTRACE + SVGO)
      </text>
      <line x1="650" y1="70" x2="650" y2="820" stroke="#1E293B" stroke-dasharray="6,6" stroke-width="2"/>

      <!-- Section 1: Full Lockup (Large) -->
      <text x="50" y="125" font-family="'Share Tech Mono', monospace" font-size="13" fill="#8A96A4">
        SIZE 1: FULL LOCKUP (600x320)
      </text>

      <!-- Section 2: Compact Horizontal (Medium) -->
      <text x="50" y="480" font-family="'Share Tech Mono', monospace" font-size="13" fill="#8A96A4">
        SIZE 2: COMPACT HORIZONTAL (400x190)
      </text>

      <!-- Section 3: Monogram Glyph (Small) -->
      <text x="50" y="710" font-family="'Share Tech Mono', monospace" font-size="13" fill="#8A96A4">
        SIZE 3: MONOGRAM GLYPH (64x36 &amp; 32x18)
      </text>
    </svg>
  `;

  const compImage = sharp(Buffer.from(canvasSvg)).composite([
    // Row 1: Full Lockup
    { input: origFullBuf, top: 135, left: 40 },
    { input: tracedFullBuf, top: 135, left: 660 },

    // Row 2: Compact Horizontal
    { input: origCompactBuf, top: 495, left: 140 },
    { input: tracedCompactBuf, top: 495, left: 760 },

    // Row 3: Monogram
    { input: origMonoBuf, top: 730, left: 308 },
    { input: tracedMonoBuf, top: 730, left: 928 },
  ]);

  await compImage.png().toFile('scratch_fidelity_comparison.png');
  console.log('Saved scratch_fidelity_comparison.png');
}

generateSideBySide();
