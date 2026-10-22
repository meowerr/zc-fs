import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  Flame, 
  Gauge, 
  Layers, 
  CheckCircle2, 
  Send, 
  Sun, 
  Moon, 
  Sparkles 
} from 'lucide-react';
import { ZfsMonogram } from '../brand/ZfsMonogram';
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

  const paletteColors = [
    ['Canvas', '#070A0E'],
    ['Surface', '#11161D'],
    ['Cyan', '#00D9FF'],
    ['Orange', '#E07212'],
  ] as const;

  return (
    <div className="min-h-dvh bg-cyber-bg text-cyber-primary p-4 sm:p-6 lg:p-8 space-y-10 max-w-7xl mx-auto selection:bg-accent-cyan selection:text-black">
      {/* ─── Top Telemetry Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-label font-mono font-medium tracking-widest uppercase">
              // DESIGN SYSTEM
            </span>
            <span className="font-mono text-xs text-cyber-muted">v2.4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wider uppercase">
            PitLane Design System
          </h1>
          <p className="text-xs sm:text-sm text-cyber-secondary font-sans max-w-2xl leading-relaxed">
            Motorsport telemetry meets clean cyber-optimism. Dark neutral foundation with purposeful accent hierarchy.
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
              1. Palette Architecture (Foundation & Accents)
            </h2>
          </div>
          <span className="text-label font-mono text-cyber-muted">FOUNDATION & ACCENTS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {paletteColors.map(([name, hex]) => (
            <div
              key={name}
              onClick={() => copyToClipboard(hex)}
              className="p-3 rounded-xl bg-cyber-surface border border-cyber-border hover:border-accent-cyan/40 transition-all cursor-pointer space-y-1.5"
            >
              <div 
                className="w-full h-8 rounded-lg flex items-center justify-center font-mono text-label font-medium"
                style={{ backgroundColor: hex }}
              >
                {copiedColor === hex ? 'COPIED' : ''}
              </div>
              <div className="font-bold text-xs text-cyber-primary">{name}</div>
              <div className="font-mono text-label text-cyber-muted">{hex}</div>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SUB_TEAMS.map((team) => (
            <div
              key={team.id}
              className="p-3 rounded-xl bg-cyber-surface border border-cyber-border space-y-1"
              style={{ borderLeftColor: team.color_accent || '#00D9FF', borderLeftWidth: '3px' }}
            >
              <span className="font-mono text-label text-cyber-muted uppercase block">{team.slug}</span>
              <div className="font-bold text-xs text-cyber-primary truncate">{team.name.split(' - ')[1]}</div>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {([
                ['Primary', 'primary', Activity, 'Launch'],
                ['Secondary', 'secondary', Layers, 'Inspect'],
                ['Action', 'action', Flame, 'Run'],
                ['Danger', 'danger', Flame, 'Halt'],
              ] as const).map(([label, variant, IconComp, text]) => (
                <div key={label} className="space-y-1.5">
                  <span className="font-mono text-label text-cyber-muted uppercase block">{label}</span>
                  <GlossyButton variant={variant} icon={<IconComp className="w-4 h-4" />}>
                    {text}
                  </GlossyButton>
                </div>
              ))}
            </div>
          </div>

          {/* Chamfer & Sizing Sub-Row */}
          <div className="pt-4 border-t border-cyber-border space-y-3">
            <div className="text-xs font-mono text-cyber-muted uppercase tracking-wider">
              // Motorsport Chamfer & Touch Target Sizing (36px sm / 44px md / 48px lg)
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GlossyButton variant="primary" size="sm" icon={<Activity className="w-4 h-4" />}>
                SM (36px)
              </GlossyButton>
              <GlossyButton variant="action" size="md" chamfer icon={<Flame className="w-4 h-4" />}>
                Chamfered
              </GlossyButton>
              <GhostButton size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                Ghost
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
            {([
              ['To Do', 'todo'],
              ['In Progress', 'in_progress'],
              ['Submitted', 'submitted'],
              ['Approved', 'approved'],
              ['Revisions', 'changes_requested'],
              ['Done', 'done'],
            ] as const).map(([label, status]) => (
              <div key={label} className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
                <span className="text-label font-mono text-cyber-muted uppercase block">{label}</span>
                <div className="flex justify-center"><LedStatusChip status={status} /></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlowInput
              label="Interactive Telemetry Input"
              placeholder="Type here..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              hint="Editable field"
            />
            <GlowInput
              label="Validation Error State"
              placeholder="CAN-BUS ID"
              defaultValue="0x999_OVERFLOW"
              error="Value exceeds 11-bit telemetry identifier"
            />
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

        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cyber-secondary uppercase">Battery State of Charge</span>
            <span className="font-mono font-medium text-sm text-accent-lime">88%</span>
          </div>
          <SegmentedGauge value={88} totalSegments={10} accentColor="#10E57A" />
          <span className="text-label font-mono block pt-1 text-cyber-muted">Accumulator nominal</span>
        </GlassCard>
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

        <GlassCard className="p-5 space-y-3">
          {([
            ['// Orbitron — Headers', 'text-accent-cyan', <div className="text-xl font-display font-black uppercase">ZEWAIL FORMULA STUDENT</div>],
            ['// Exo 2 — Body', 'text-brand-orange', <p className="text-xs font-sans text-cyber-primary">Motorsport telemetry meets clean cyber-optimism.</p>],
            ['// Share Tech Mono — Telemetry', 'text-accent-yellow', <div className="font-mono text-xs text-cyber-secondary">SYS.ID: ZCFS-2026-CHASSIS-004 // 384.2V</div>],
          ] as const).map(([tag, cls, body]) => (
            <div key={tag} className="space-y-1 border-b last:border-b-0 border-cyber-border pb-2.5 last:pb-0">
              <span className={`text-label font-mono ${cls} uppercase block`}>{tag}</span>
              {body}
            </div>
          ))}
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
          {([
            ['Desktop Hybrid Racing Rail (72px → 288px)', 'OVERLAY Z-35', 'text-accent-cyan', 'Console reserving fixed left offset (--rail-offset).', ['Collapsed 72px', 'Expanded 288px', '≥1280px Docking']],
            ['Mobile "Garage Door" Navigation', 'THUMB-ARC TAB', 'text-brand-orange', 'Edge thumb-arc glass tab opening into responsive navigation sheet.', ['Floating Tab (56px)', '78vh Sheet', 'Swipe Dismiss']],
          ] as const).map(([title, badge, color, desc, tags]) => (
            <GlassCard key={title} className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-cyber-border pb-2.5">
                <span className={`text-xs font-mono font-medium ${color} uppercase`}>// {title}</span>
                <span className={`text-label font-mono px-2 py-0.5 rounded bg-white/5 border border-cyber-border ${color}`}>{badge}</span>
              </div>
              <p className="text-xs text-cyber-secondary leading-relaxed">{desc}</p>
              <div className="flex gap-2 text-label font-mono text-cyber-muted">
                {tags.map((t) => (
                  <span key={t} className="px-2 py-1 rounded bg-cyber-bg-alt border border-cyber-border">{t}</span>
                ))}
              </div>
            </GlassCard>
          ))}
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

        {/* 10.1 Vector Lockup Showcase */}
        <div className="p-6 rounded-2xl border border-white/15 bg-cyber-bg space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border/40 pb-3">
            <span className="text-xs font-mono font-medium flex items-center gap-1.5 text-brand-orange">
              <span className="w-2 h-2 rounded-full bg-brand-orange" />
              // 10.1 Vector Mark Lockup (SVG &lt;= 6.3 KB)
            </span>
            <span className="text-label font-mono px-2 py-0.5 rounded bg-white/10">MIDNIGHT DEFAULT</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 space-y-2">
            <ZfsMonogram glow className="w-full max-w-xs h-auto" />
          </div>
        </div>

        {/* 10.3 Brand Actions & Semantics */}
        <GlassCard className="p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-cyber-border pb-2.5">
            <span className="text-xs font-mono font-medium text-brand-orange uppercase">
              // 10.2 Brand Action Controls &amp; Status Semantics
            </span>
            <span className="text-label font-mono px-2 py-0.5 rounded bg-accent-lime/15 text-accent-lime border border-accent-lime/30">
              5.23:1 RATIO (AA)
            </span>
          </div>

          <p className="text-xs text-cyber-secondary leading-relaxed">
            Actions use <code className="text-brand-orange">#E07212</code> (5.23:1 AA). Motorsport telemetry tokens re-mapped for high contrast.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button className="px-4 py-2 rounded-lg bg-brand-orange text-black font-display font-bold text-xs uppercase">
              Primary Brand
            </button>
            <span className="px-2.5 py-1 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs font-mono">PROGRESS #00D9FF</span>
            <span className="px-2.5 py-1 rounded bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-mono">APPROVED #10E57A</span>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

