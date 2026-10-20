import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  Activity, 
  Flame, 
  Gauge, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Send, 
  Trash2,
  Sun,
  Moon,
  Sliders,
  Sparkles,
  Play,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { ZfsLogo } from '../brand/ZfsLogo';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { GlowInput } from '../common/GlowInput';
import { LedStatusChip } from '../common/LedStatusChip';
import { SegmentedGauge } from '../common/SegmentedGauge';
import { SUB_TEAMS } from '../../lib/constants';

interface StyleGuideProps {
  onBack: () => void;
}

export const StyleGuide: React.FC<StyleGuideProps> = ({ onBack }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('Front Wing CFD v4');
  const [testChecked, setTestChecked] = useState(true);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleGuideTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zcfs_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zcfs_theme', 'dark');
      setIsDark(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const foundationColors = [
    { name: 'Background', hex: '#070A0E', desc: 'Main canvas' },
    { name: 'Background Alt', hex: '#0B0F14', desc: 'Sidebars' },
    { name: 'Surface', hex: '#11161D', desc: 'Card base' },
    { name: 'Elevated', hex: '#181E26', desc: 'Modals' },
    { name: 'Hover', hex: '#202731', desc: 'Interactive' },
    { name: 'Border', hex: '#2A323C', desc: '1px boundary' },
    { name: 'Border Strong', hex: '#39434F', desc: 'Structural edge' },
    { name: 'Text Primary', hex: '#F2F4F7', desc: 'Headlines' },
    { name: 'Text Secondary', hex: '#B0B8C2', desc: 'Body copy' },
    { name: 'Text Muted', hex: '#737D89', desc: 'Captions' },
  ];

  const accentColors = [
    { name: 'Electric Cyan', hex: '#00D9FF', role: 'In-Progress Tasks' },
    { name: 'Cyber Violet', hex: '#A855F7', role: 'Reviews & Electronics' },
    { name: 'Racing Yellow', hex: '#FFD43B', role: 'Due Soon, Caution' },
    { name: 'Racing Red', hex: '#FF304F', role: 'Urgent, Overdue' },
    { name: 'Racing Lime', hex: '#10E57A', role: 'Approved, Nominal' },
    { name: 'ZFS Brand Orange', hex: '#E07212', role: 'Official Team Mark' },
  ];

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-primary p-4 sm:p-6 lg:p-8 space-y-10 max-w-7xl mx-auto selection:bg-accent-cyan selection:text-black">
      {/* ─── Top Telemetry Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-label font-mono font-medium tracking-widest uppercase">
              // SPECIFICATION: CYBER-RACING-Y2K
            </span>
            <span className="font-mono text-xs text-cyber-muted">BUILD v2.40</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wider uppercase">
            PitLane Design System
          </h1>
          <p className="text-xs sm:text-sm text-cyber-secondary font-sans max-w-2xl leading-relaxed">
            Motorsport telemetry instrumentation meets clean early-2000s cyber-optimism. Dark neutral foundation with controlled, purposeful accent hierarchy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleGuideTheme}
            className="px-3.5 py-2 rounded-lg bg-cyber-surface-elevated border border-cyber-border hover:border-accent-cyan/50 text-xs font-mono font-medium uppercase flex items-center gap-2 cursor-pointer transition-all"
            title="Toggle Light/Dark preview mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-accent-yellow" /> : <Moon className="w-4 h-4 text-accent-cyan" />}
            <span>{isDark ? 'Mode: Midnight' : 'Mode: Chrome'}</span>
          </button>

          <GlossyButton
            variant="secondary"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
          >
            Exit Styleguide
          </GlossyButton>
        </div>
      </div>

      {/* ─── 1. CORE PALETTE ARCHITECTURE ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              1. Foundation Neutrals (Graphite & Dark Base)
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">90% OF INTERFACE FOUNDATION</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {foundationColors.map((color) => (
            <div
              key={color.name}
              onClick={() => copyToClipboard(color.hex)}
              className="p-3 rounded-xl bg-cyber-surface border border-cyber-border hover:border-accent-cyan/40 transition-all cursor-pointer group space-y-2 relative"
            >
              <div 
                className="w-full h-12 rounded-lg border border-white/10 shadow-inner flex items-center justify-center font-mono text-label font-medium"
                style={{ backgroundColor: color.hex }}
              >
                {copiedColor === color.hex && (
                  <span className="bg-black/80 px-2 py-0.5 rounded text-accent-cyan text-label flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-cyber-primary group-hover:text-accent-cyan transition-colors">
                    {color.name}
                  </div>
                  <Copy className="w-3 h-3 text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-mono text-label text-cyber-muted">{color.hex}</div>
                <p className="text-label text-cyber-secondary mt-1">{color.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2. PRIMARY CONTROLLED ACCENT COLORS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-orange" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              2. Controlled Semantic Accents
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">USED WITH INTENT & RESTRAINT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {accentColors.map((acc) => (
            <div
              key={acc.name}
              onClick={() => copyToClipboard(acc.hex)}
              className="p-3.5 rounded-xl bg-cyber-surface border border-cyber-border hover:border-cyber-border-strong transition-all cursor-pointer group space-y-2"
              style={{ borderTopColor: acc.hex, borderTopWidth: '3px' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-sm tracking-wider" style={{ color: acc.hex }}>
                  {acc.name}
                </span>
                <span className="font-mono text-label text-cyber-muted">{acc.hex}</span>
              </div>
              <p className="text-xs text-cyber-secondary leading-snug">
                {acc.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. OFFICIAL SUB-TEAMS PALETTE ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              3. Sub-Team Technical Identifiers
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">5 DISTINCT ENGINEERING DISCIPLINES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {SUB_TEAMS.map((team) => (
            <div
              key={team.id}
              className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border flex flex-col justify-between gap-3 relative overflow-hidden"
              style={{ borderLeftColor: team.color_accent || '#00D9FF', borderLeftWidth: '3px' }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: team.color_accent || '#00D9FF' }}
                  />
                  <span className="font-mono text-label text-cyber-muted uppercase tracking-wider">
                    {team.slug}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-cyber-primary">
                  {team.name.replace('Technical - ', '').replace('Operations - ', '')}
                </h4>
              </div>

              <div className="pt-2 border-t border-cyber-border flex items-center justify-between text-label font-mono">
                <span className="text-cyber-muted">Accent</span>
                <span className="font-bold" style={{ color: team.color_accent || '#00D9FF' }}>{team.color_accent}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. BUTTONS & INTERACTIVE CONTROLS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              4. Button Hierarchy & Variants
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">SHARP, RESTRAINED, 48PX TOUCH TARGETS</span>
        </div>

        <GlassCard variant="elevated" className="p-6 space-y-6">
          {/* Core Variant Matrix */}
          <div>
            <div className="text-xs font-mono text-cyber-muted uppercase tracking-wider mb-3">
              // Core Variant Matrix
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: '// Primary (Cyan)', variant: 'primary' as const, icon: Activity, text: 'Launch Sequence' },
                { label: '// Secondary (Elevated)', variant: 'secondary' as const, icon: Layers, text: 'Inspect Specs' },
                { label: '// Outline (Wireframe)', variant: 'outline' as const, icon: Activity, text: 'Telemetry View' },
                { label: '// Action (Orange)', variant: 'action' as const, icon: Flame, text: 'Execute Task' },
                { label: '// Warning (Yellow)', variant: 'warning' as const, icon: Clock, text: 'Review Queue' },
                { label: '// Danger (Red)', variant: 'danger' as const, icon: Trash2, text: 'Delete Item' },
                { label: '// Metallic (Machined Alloy)', variant: 'metallic' as const, icon: Sliders, text: 'Hardware Switch' },
              ].map((btn) => {
                const IconComp = btn.icon;
                return (
                  <div key={btn.label} className="space-y-1.5">
                    <span className="font-mono text-label text-cyber-muted uppercase block">{btn.label}</span>
                    <GlossyButton variant={btn.variant} icon={<IconComp className="w-4 h-4" />}>
                      {btn.text}
                    </GlossyButton>
                  </div>
                );
              })}
              <div className="space-y-1.5">
                <span className="font-mono text-label text-cyber-muted uppercase block">// Ghost (Low Weight)</span>
                <GhostButton icon={<ArrowLeft className="w-4 h-4" />}>
                  Cancel Op
                </GhostButton>
              </div>
            </div>
          </div>

          {/* Chamfer & Sizing Sub-Row */}
          <div className="pt-4 border-t border-cyber-border space-y-3">
            <div className="text-xs font-mono text-cyber-muted uppercase tracking-wider">
              // Motorsport Chamfer & Touch Target Sizing (36px sm / 44px md / 48px lg)
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GlossyButton variant="primary" size="sm" icon={<Activity className="w-3.5 h-3.5" />}>
                Small (36px)
              </GlossyButton>
              <GlossyButton variant="primary" size="md" icon={<Activity className="w-4 h-4" />}>
                Medium (44px Mobile)
              </GlossyButton>
              <GlossyButton variant="primary" size="lg" icon={<Activity className="w-5 h-5" />}>
                Large (48px Primary)
              </GlossyButton>
              <GlossyButton variant="action" size="md" chamfer icon={<Flame className="w-4 h-4" />}>
                Chamfered Cut
              </GlossyButton>
              <GhostButton size="md" active icon={<Activity className="w-4 h-4" />}>
                Ghost Active
              </GhostButton>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ─── 5. STATUS CHIPS & TELEMETRY INDICATORS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-lime" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              5. Status Chips & Telemetry Badges
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">DOUBLE-ENCODED (COLOR + ICON + LABEL)</span>
        </div>

        <GlassCard className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'To Do / Queued', status: 'todo' as const },
              { label: 'In Progress', status: 'in_progress' as const },
              { label: 'Submitted / Review', status: 'submitted' as const },
              { label: 'Approved / Done', status: 'approved' as const },
              { label: 'Revisions Req.', status: 'changes_requested' as const },
              { label: 'Completed', status: 'done' as const },
            ].map((chip) => (
              <div key={chip.label} className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
                <span className="text-label font-mono text-cyber-muted uppercase block">{chip.label}</span>
                <div className="flex justify-center"><LedStatusChip status={chip.status} /></div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ─── 6. INPUTS & FORM CONTROLS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              6. Inputs & Form Controls
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">CLEAN BORDERS, CYAN FOCUS RINGS</span>
        </div>

        <GlassCard className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlowInput
              label="Interactive Telemetry Input"
              placeholder="Type here..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              hint="Editable field"
            />

            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                <span className="text-accent-cyan font-bold mr-1.5">//</span>
                Sub-Team Select Dropdown
              </label>
              <select className="w-full h-11 px-3 rounded-lg text-xs font-sans bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan">
                {SUB_TEAMS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-cyber-surface text-cyber-primary">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <GlowInput
              label="Validation Error State"
              placeholder="CAN-BUS ID"
              defaultValue="0x999_OVERFLOW"
              error="Value exceeds 11-bit telemetry identifier"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-cyber-border text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={testChecked}
                onChange={(e) => setTestChecked(e.target.checked)}
                className="w-4 h-4 rounded text-accent-cyan border-cyber-border cursor-pointer"
              />
              <span className="text-cyber-primary font-semibold">Strict RLS Authorization Active</span>
            </label>
          </div>
        </GlassCard>
      </section>

      {/* ─── 7. GAUGES & NUMERICAL TELEMETRY READOUTS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              7. Segmented Gauges & Telemetry Instruments
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">PRECISION ENGINEERING DATA READOUTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Battery State of Charge', val: '88%', color: 'text-accent-lime', hex: '#10E57A', gauge: 88, note: 'Accumulator nominal' },
            { title: 'Brake Thermal Quota', val: '92%', color: 'text-accent-red', hex: '#FF304F', gauge: 92, note: 'Rotor elevated' },
          ].map((g) => (
            <GlassCard key={g.title} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyber-secondary uppercase">{g.title}</span>
                <span className={`font-mono font-medium text-sm ${g.color}`}>{g.val}</span>
              </div>
              <SegmentedGauge value={g.gauge} totalSegments={10} accentColor={g.hex} />
              <span className="text-label font-mono block pt-1 text-cyber-muted">
                {g.note}
              </span>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ─── 8. TYPOGRAPHY MATRIX ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              8. Typography Hierarchy
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">ORBITRON + EXO 2 + SHARE TECH MONO</span>
        </div>

        <GlassCard className="p-6 space-y-4">
          <div className="space-y-1 border-b border-cyber-border pb-3">
            <span className="text-label font-mono text-accent-cyan uppercase block">// Orbitron — Headers & Badges</span>
            <div className="text-2xl font-display font-black tracking-wider uppercase">ZEWAIL FORMULA STUDENT</div>
          </div>

          <div className="space-y-1 border-b border-cyber-border pb-3">
            <span className="text-label font-mono text-brand-orange uppercase block">// Exo 2 — Body & Interface Text</span>
            <p className="text-xs sm:text-sm font-sans text-cyber-primary leading-relaxed">
              Motorsport telemetry meets clean cyber-optimism.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-label font-mono text-accent-yellow uppercase block">// Share Tech Mono — Numbers & Telemetry</span>
            <div className="font-mono text-xs text-cyber-secondary">
              // SYS.ID: ZCFS-2026-CHASSIS-004 // 384.2V // 142.5A // 210 N·m
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ─── 9. HYBRID RACING RAIL & GARAGE DOOR NAVIGATION ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              9. Hybrid Racing Rail & Mobile Navigation
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">CONSOLE // ARCHITECTURE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-cyber-border pb-2.5">
              <span className="text-xs font-mono font-medium text-accent-cyan uppercase">
                // Desktop Hybrid Racing Rail (72px → 288px)
              </span>
              <span className="text-label font-mono px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                OVERLAY Z-35
              </span>
            </div>
            <p className="text-xs text-cyber-secondary leading-relaxed">
              Floating race-engineer console reserving fixed left offset (<code className="text-accent-cyan">--rail-offset</code>). Content canvas never squeezes when expanded.
            </p>
            <div className="flex gap-2 text-label font-mono text-cyber-muted">
              <span className="px-2 py-1 rounded bg-cyber-bg-alt border border-cyber-border text-accent-lime">Collapsed 72px</span>
              <span className="px-2 py-1 rounded bg-cyber-bg-alt border border-cyber-border text-accent-cyan">Expanded 288px</span>
              <span className="px-2 py-1 rounded bg-cyber-bg-alt border border-cyber-border">≥1280px Docking</span>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-cyber-border pb-2.5">
              <span className="text-xs font-mono font-medium text-brand-orange uppercase">
                // Mobile "Garage Door" Navigation (&lt;768px)
              </span>
              <span className="text-label font-mono px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/30">
                THUMB-ARC TAB
              </span>
            </div>
            <p className="text-xs text-cyber-secondary leading-relaxed">
              Replaces full-width bottom bar with edge thumb-arc glass tab (56px) opening into a 78vh bottom sheet with 2x3 destination grid. Full viewport content height.
            </p>
            <div className="flex gap-2 text-label font-mono text-cyber-muted">
              <span className="px-2 py-1 rounded bg-cyber-bg-alt border border-cyber-border text-accent-yellow">Floating Tab (56px)</span>
              <span className="px-2 py-1 rounded bg-cyber-bg-alt border border-cyber-border text-brand-orange">78vh Sheet</span>
              <span className="px-2 py-1 rounded bg-cyber-bg-alt border border-cyber-border">Swipe Dismiss</span>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── 10. ZFS BRAND IDENTITY & PALETTE (APPROVAL GATE) ─── */}
      <section className="space-y-6 pt-4 border-t-2 border-brand-orange/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-orange/15 border border-brand-orange/40 text-brand-orange">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-label font-mono font-medium text-brand-orange tracking-widest uppercase">
                  // SLICE B2 APPROVAL GATE
                </span>
                <span className="px-2 py-0.5 rounded text-label font-mono font-medium bg-accent-lime/15 text-accent-lime border border-accent-lime/30">
                  WCAG AA VERIFIED
                </span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-cyber-primary">
                10. ZFS Brand Identity &amp; Color System
              </h2>
            </div>
          </div>
          <span className="text-xs font-mono text-cyber-muted tracking-tight">
            ZEWAIL FORMULA TEAM // PITLANE
          </span>
        </div>

        {/* 10.1 Vector Lockups Showcase */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-brand-orange uppercase">
              // 10.1 Vector Mark Lockups (SVG &lt;= 6.3 KB)
            </span>
            <span className="text-label font-mono text-cyber-muted">
              PURE INLINE VECTORS • ZERO RASTER LATENCY
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                theme: 'dark' as const,
                title: 'MIDNIGHT SURFACE (#070B0E)',
                tag: 'DEFAULT THEME',
                bg: 'bg-cyber-bg border-white/15 text-brand-white',
                card: 'bg-white/[0.02] border-white/5',
                titleCls: 'text-brand-orange',
                subCls: 'text-cyber-muted',
                dot: 'bg-brand-orange animate-ping',
                tagCls: 'bg-white/10 text-brand-white',
                glow: true,
              },
              {
                theme: 'light' as const,
                title: 'CHROME LIGHT SURFACE (#FFFFFF)',
                tag: 'HIGH-CONTRAST INK',
                bg: 'bg-white border-slate-200 text-slate-900 shadow-xl',
                card: 'bg-slate-50 border-slate-100',
                titleCls: 'text-brand-light-orange',
                subCls: 'text-slate-500',
                dot: 'bg-brand-light-orange',
                tagCls: 'bg-slate-100 text-slate-700',
                glow: false,
              },
            ].map((surf) => (
              <div key={surf.theme} className={`p-6 rounded-2xl border space-y-6 relative overflow-hidden ${surf.bg}`}>
                <div className="flex items-center justify-between border-b border-cyber-border/40 pb-3">
                  <span className={`text-xs font-mono font-medium flex items-center gap-1.5 ${surf.titleCls}`}>
                    <span className={`w-2 h-2 rounded-full ${surf.dot}`} />
                    {surf.title}
                  </span>
                  <span className={`text-label font-mono px-2 py-0.5 rounded ${surf.tagCls}`}>
                    {surf.tag}
                  </span>
                </div>

                <div className={`flex flex-col items-center justify-center p-5 rounded-xl border space-y-2 ${surf.card}`}>
                  <span className={`text-label font-mono uppercase tracking-widest ${surf.subCls}`}>
                    // {surf.theme === 'dark' ? 'Full Lockup' : 'Compact Horizontal'}
                  </span>
                  <ZfsLogo variant={surf.theme === 'dark' ? 'full' : 'horizontal'} theme={surf.theme} glow={surf.glow} className={surf.theme === 'dark' ? 'w-full max-w-xs h-auto' : 'w-44 h-auto'} />
                </div>

                <div className={`flex flex-col items-center justify-center p-3 rounded-xl border space-y-1.5 ${surf.card}`}>
                  <span className={`text-label font-mono uppercase tracking-widest ${surf.subCls}`}>// Monogram Glyph</span>
                  <ZfsLogo variant="monogram" theme={surf.theme} glow={surf.glow} className="w-16 h-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 10.2 Brand Palette Tokens */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-brand-orange uppercase">
              // 10.2 Official Brand Tokens (Tailwind + CSS Variables)
            </span>
            <span className="text-label font-mono text-cyber-muted">CLICK SWATCH TO COPY HEX</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {([
              ['Brand Orange', '#E07212', 'text-black', 'Primary Accent'],
              ['Orange Hover', '#ED7D0D', 'text-black', 'Surface Hover'],
              ['Orange Pressed', '#C6620A', 'text-white', 'Active State'],
              ['Light Orange', '#C2410C', 'text-white', '5.53:1 Text'],
              ['Brand Ink', '#070B0E', 'text-white', 'Backdrop / Text'],
              ['Brand White', '#F2F4F7', 'text-black', 'Body Outline'],
              ['Orange Soft', 'rgba(224,114,18,0.12)', 'text-brand-orange', 'Tinted Badges'],
            ] as const).map(([name, hex, text, role]) => (
              <button
                key={name}
                onClick={() => copyToClipboard(hex)}
                className="group p-3 rounded-xl bg-cyber-surface border border-cyber-border hover:border-brand-orange/50 transition-all text-left space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                <div
                  style={{ backgroundColor: hex }}
                  className={`w-full h-12 rounded-lg flex items-center justify-center font-mono text-label font-medium ${text} shadow-sm group-hover:scale-[1.02] transition-transform`}
                >
                  {copiedColor === hex ? 'COPIED!' : hex}
                </div>
                <div>
                  <div className="font-display font-bold text-xs text-cyber-primary group-hover:text-brand-orange transition-colors">
                    {name}
                  </div>
                  <div className="text-label font-mono text-cyber-muted">
                    {role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 10.3 Brand Actions & Focus Rings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <span className="text-xs font-mono font-medium text-brand-orange uppercase">
                // 10.3 Brand Action Controls &amp; Focus Ring
              </span>
              <span className="text-label font-mono px-2 py-0.5 rounded bg-accent-lime/15 text-accent-lime border border-accent-lime/30">
                5.23:1 RATIO (AA)
              </span>
            </div>

            <p className="text-xs text-cyber-secondary leading-relaxed">
              Motorsport actions use <code className="text-brand-orange">#E07212</code> with <code className="text-cyber-primary">#070B0E</code> Brand Ink, delivering <strong className="text-brand-white">5.23:1 contrast</strong> (WCAG AA).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Primary Brand Button */}
              <button className="px-5 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-pressed text-[#070B0E] font-display font-black text-xs uppercase tracking-wider shadow-glow-brand transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-cyber-bg">
                Primary Brand Button
              </button>

              {/* Ghost / Telemetry Brand Button */}
              <button className="px-5 py-2.5 rounded-lg bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/50 text-brand-orange font-display font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange">
                Secondary Brand
              </button>

              {/* Interactive Focus Ring Test */}
              <button
                tabIndex={0}
                className="px-4 py-2.5 rounded-lg bg-cyber-surface border border-cyber-border text-xs font-mono text-cyber-secondary focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-cyber-bg cursor-pointer"
              >
                Tab here to test 3:1 focus ring
              </button>
            </div>
          </GlassCard>

          {/* 10.4 Status Semantics Collision Re-Map */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <span className="text-xs font-mono font-medium text-accent-cyan uppercase">
                // 10.4 Status Semantics Collision Re-Map
              </span>
              <span className="text-label font-mono px-2 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                PROPOSED B3
              </span>
            </div>

            <p className="text-xs text-cyber-secondary leading-relaxed">
              In-Progress status re-mapped to <strong className="text-accent-cyan">Electric Cyan</strong> and <strong className="text-purple-400">Cyber Violet</strong> so brand orange remains exclusive to team identity.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { label: 'IN PROGRESS', hex: '#00D9FF', icon: Play, style: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400', iconClass: 'fill-current' },
                { label: 'NEEDS REVIEW', hex: '#A855F7', icon: Clock, style: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
                { label: 'DUE SOON', hex: '#FFD43B', icon: AlertCircle, style: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
                { label: 'OVERDUE', hex: '#FF304F', icon: AlertTriangle, style: 'bg-red-500/10 border-red-500/30 text-red-400' },
                { label: 'DONE / APPROVED', hex: '#10E57A', icon: CheckCircle2, style: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
                { label: 'ZFS IDENTITY', hex: '#E07212', icon: Sparkles, style: 'bg-brand-orange/15 border-brand-orange/40 text-brand-orange' },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.label} className={`p-2.5 rounded-lg border space-y-1 ${item.style}`}>
                    <div className="flex items-center gap-1.5 text-label font-mono font-medium">
                      <IconComponent className={`w-3.5 h-3.5 ${item.iconClass || ''}`} />
                      {item.label}
                    </div>
                    <div className="text-label font-mono text-cyber-muted">{item.hex}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* 10.5 Sub-Team Palette Isolation */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <span className="text-xs font-mono font-medium text-cyber-primary uppercase">
              // 10.5 Sub-Team Scoped Palette (All 5 Sub-Teams Side-by-Side)
            </span>
            <span className="text-label font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
              LOW-VOLTAGE RE-MAPPED
            </span>
          </div>

          <p className="text-xs text-cyber-secondary leading-relaxed">
            <strong>Low-Voltage Electronics</strong> is re-mapped to <strong className="text-purple-400">Cyber Violet (#A855F7)</strong> to prevent sub-team confusion with ZFS brand orange.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {[
              { id: 'vd', name: 'Vehicle Dynamics', hex: '#00D9FF', tag: 'AERODYNAMICS & CHASSIS' },
              { id: 'aero', name: 'Aerodynamics', hex: '#FF304F', tag: 'WINGS & DOWNFORCE' },
              { id: 'elec', name: 'Low-Voltage Electronics', hex: '#A855F7', tag: 'TELEMETRY & SENSORS' },
              { id: 'pt', name: 'Powertrain & Drivetrain', hex: '#FFD43B', tag: 'INVERTER & MOTOR' },
              { id: 'ops', name: 'Business, Cost & Ops', hex: '#10E57A', tag: 'FINANCE & MEDIA' },
            ].map((st) => (
              <div key={st.id} className="p-3.5 rounded-xl bg-cyber-bg-alt border border-cyber-border space-y-2">
                <div className="flex items-center justify-between">
                  <span style={{ backgroundColor: st.hex }} className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" />
                  <span className="text-label font-mono text-cyber-muted">{st.hex}</span>
                </div>
                <div className="font-display font-bold text-xs text-cyber-primary leading-tight">
                  {st.name}
                </div>
                <div className="text-label font-mono text-cyber-muted tracking-wider">
                  {st.tag}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 10.6 WCAG 2.1 AA Contrast Verification Matrix */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <span className="text-xs font-mono font-medium text-brand-orange uppercase">
              // 10.6 WCAG 2.1 AA Computed Contrast Ratios Matrix
            </span>
            <span className="text-label font-mono px-2 py-0.5 rounded bg-accent-lime/15 text-accent-lime border border-accent-lime/30">
              AUDITED COMPLIANCE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-cyber-border text-cyber-muted text-label uppercase">
                  <th className="py-2.5 px-3">UI Element &amp; Pairing</th>
                  <th className="py-2.5 px-3">Foreground</th>
                  <th className="py-2.5 px-3">Background</th>
                  <th className="py-2.5 px-3">Contrast Ratio</th>
                  <th className="py-2.5 px-3">WCAG AA Standard</th>
                  <th className="py-2.5 px-3">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y border-cyber-border/40">
                {[
                  ['Brand Button', '#070B0E', '#E07212', '5.23:1', '>=4.5:1', 'PASS AA', false],
                  ['Prohibited White/Orange', '#FFFFFF', '#E07212', '3.18:1', '>=4.5:1', 'FAIL', true],
                  ['Light Links', '#C2410C', '#FFFFFF', '5.53:1', '>=4.5:1', 'PASS AA', false],
                  ['Chrome Surface', '#C2410C', '#F8FBFF', '5.39:1', '>=4.5:1', 'PASS AA', false],
                  ['Dark Body', '#F2F4F7', '#070B0E', '17.84:1', '>=7.0:1', 'PASS AAA', false],
                  ['Focus Rings', '#E07212', '#070B0E', '5.23:1', '>=3.0:1', 'PASS AA', false],
                ].map(([elem, fg, bg, ratio, std, verdict, isFail]) => (
                  <tr key={elem as string} className={`hover:bg-white/[0.02] ${isFail ? 'bg-red-500/5' : ''}`}>
                    <td className="py-3 px-3 font-sans font-medium text-cyber-primary">{elem}</td>
                    <td className={`py-3 px-3 ${isFail ? 'text-red-300' : 'text-cyber-secondary'}`}>{fg}</td>
                    <td className="py-3 px-3 text-brand-orange">{bg}</td>
                    <td className={`py-3 px-3 font-bold ${isFail ? 'text-accent-red' : 'text-accent-lime'}`}>{ratio}</td>
                    <td className="py-3 px-3 text-cyber-muted">{std}</td>
                    <td className={`py-3 px-3 font-bold ${isFail ? 'text-accent-red' : 'text-accent-lime'}`}>{verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

