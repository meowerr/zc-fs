import sharp from 'sharp';

async function samplePreciseColors() {
  const image = sharp('brand-source/zfs-logo.jpg');
  const metadata = await image.metadata();
  console.log('Image dimensions:', metadata.width, 'x', metadata.height);

  // Helper to sample area and get most frequent colors and averages
  async function sampleArea(name, left, top, width, height, filterFn) {
    const buf = await sharp('brand-source/zfs-logo.jpg')
      .extract({ left, top, width, height })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let map = new Map();
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < buf.data.length; i += buf.info.channels) {
      const r = buf.data[i], g = buf.data[i+1], b = buf.data[i+2];
      if (filterFn(r, g, b)) {
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        map.set(hex, (map.get(hex) || 0) + 1);
        rSum += r; gSum += g; bSum += b; count++;
      }
    }
    const topHexes = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const avg = count > 0 ? [Math.round(rSum/count), Math.round(gSum/count), Math.round(bSum/count)] : [0,0,0];
    const avgHex = '#' + avg.map(v => v.toString(16).padStart(2, '0')).join('');
    console.log(`\n--- ${name} (matched ${count} pixels) ---`);
    console.log(`Average: ${avgHex} RGB(${avg.join(', ')})`);
    console.log('Top frequencies:', topHexes);
    return { avg, avgHex, topHexes };
  }

  // 1. Background
  await sampleArea('Dark Background', 100, 1500, 300, 300, () => true);

  // 2. Duct Orange
  await sampleArea('Duct Orange', 2500, 1800, 1400, 600, (r, g, b) => r > 160 && g > 70 && g < 180 && b < 60);

  // 3. Wing Accent Orange
  await sampleArea('Wing Accent Orange', 800, 2100, 1200, 200, (r, g, b) => r > 150 && g > 60 && b < 60);

  // 4. Car Outline White
  await sampleArea('Car Outline White', 2700, 1040, 1000, 400, (r, g, b) => r > 190 && g > 190 && b > 190);

  // 5. ZFS Wordmark White
  await sampleArea('ZFS Wordmark White', 1500, 2900, 3400, 500, (r, g, b) => r > 200 && g > 200 && b > 200);

  // 6. ZEWAIL FORMULA TEAM text
  await sampleArea('ZEWAIL FORMULA TEAM Text Orange', 1400, 3600, 3600, 140, (r, g, b) => r > 160 && g > 70 && b < 70);
}

samplePreciseColors();
