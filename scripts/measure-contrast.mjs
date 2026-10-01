function hexToLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(hex1, hex2) {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

console.log('=== WCAG CONTRAST AUDIT ===');
console.log('Light Mode on #FFFFFF:');
console.log('  #0D1522 (text-primary):', contrast('#FFFFFF', '#0D1522').toFixed(2) + ':1');
console.log('  #475569 (text-secondary):', contrast('#FFFFFF', '#475569').toFixed(2) + ':1');
console.log('  #64748B (text-muted):', contrast('#FFFFFF', '#64748B').toFixed(2) + ':1');
console.log('  #0099B8 (accent-cyan):', contrast('#FFFFFF', '#0099B8').toFixed(2) + ':1');

console.log('\nLight Mode on #F3F6FA:');
console.log('  #475569 (text-secondary):', contrast('#F3F6FA', '#475569').toFixed(2) + ':1');
console.log('  #64748B (text-muted):', contrast('#F3F6FA', '#64748B').toFixed(2) + ':1');

console.log('\nDark Mode on #11161D (surface-base):');
console.log('  #F2F4F7 (text-primary):', contrast('#11161D', '#F2F4F7').toFixed(2) + ':1');
console.log('  #B0B8C2 (text-secondary):', contrast('#11161D', '#B0B8C2').toFixed(2) + ':1');
console.log('  #737D89 (old text-muted):', contrast('#11161D', '#737D89').toFixed(2) + ':1');
console.log('  #8A96A4 (improved text-muted):', contrast('#11161D', '#8A96A4').toFixed(2) + ':1');
console.log('  #94A3B8 (slate-400):', contrast('#11161D', '#94A3B8').toFixed(2) + ':1');
console.log('  #00D9FF (accent-cyan):', contrast('#11161D', '#00D9FF').toFixed(2) + ':1');

console.log('\nDark Mode on #181E26 (surface-elevated):');
console.log('  #B0B8C2 (text-secondary):', contrast('#181E26', '#B0B8C2').toFixed(2) + ':1');
console.log('  #8A96A4 (improved text-muted):', contrast('#181E26', '#8A96A4').toFixed(2) + ':1');
console.log('  #94A3B8 (slate-400):', contrast('#181E26', '#94A3B8').toFixed(2) + ':1');
console.log('  #00D9FF (accent-cyan):', contrast('#181E26', '#00D9FF').toFixed(2) + ':1');
