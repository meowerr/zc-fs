import sharp from 'sharp';
import potrace from 'potrace';
import { optimize } from 'svgo';
import fs from 'fs';
import zlib from 'zlib';

async function main() {
  const cropBox = { left: 160, top: 380, width: 2180, height: 1120 };
  const workingW = 2000;
  const workingH = Math.round((1120 * 2000) / 2180);

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
    trace(blackPng, { turdSize: 35, optTolerance: 0.9, alphaMax: 1.1 }),
    trace(orangePng, { turdSize: 35, optTolerance: 0.9, alphaMax: 1.1 }),
  ]);

  const extractPath = (svg) => {
    const m = svg.match(/<path[^>]*d="([^"]+)"/g);
    return m ? m.map((x) => x.match(/d="([^"]+)"/)[1]).join(' ') : '';
  };

  const blackPath = extractPath(blackSvg);
  const orangePath = extractPath(orangeSvg);

  console.log('Original lightPaths.ts size:', fs.readFileSync('src/assets/brand/lightPaths.ts').length);
  console.log('New blackPath length:', blackPath.length);
  console.log('New orangePath length:', orangePath.length);

  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${info.width} ${info.height}"><path d="${blackPath}"/><path d="${orangePath}"/></svg>`;
  const opt = optimize(combinedSvg, {
    multipass: true,
    floatPrecision: 0,
    plugins: [
      'preset-default',
      { name: 'removeViewBox', active: false },
      { name: 'cleanupNumericValues', params: { floatPrecision: 0 } },
      { name: 'convertPathData', params: { floatPrecision: 0, transformPrecision: 0 } },
    ],
  }).data;

  console.log('Optimized combined SVG length:', opt.length);
  console.log('Gzipped:', zlib.gzipSync(opt).length);
}

main().catch(console.error);
