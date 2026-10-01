import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  Terminal, 
  Activity, 
  Cpu, 
  Flame, 
  Gauge, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Send, 
  Trash2, 
  Sun,
  Moon,
  Calendar,
  Mail,
  Sliders,
  Shield
} from 'lucide-react';
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
  const [testEmail, setTestEmail] = useState('engineer@zewailcity.edu.eg');
  const [testDate, setTestDate] = useState('2026-10-15');
  const [testTime, setTestTime] = useState('14:30');
  const [testTextarea, setTestTextarea] = useState('Mesh resolution: 12.5M cells, k-omega SST turbulence model');
  const [testChecked, setTestChecked] = useState(true);
  const [gaugeVal, setGaugeVal] = useState(65);
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
    { name: 'Background', hex: '#070A0E', token: 'bg-cyber-bg', desc: 'Main canvas background' },
    { name: 'Background Alt', hex: '#0B0F14', token: 'bg-cyber-bg-alt', desc: 'Sidebars & panels' },
    { name: 'Surface', hex: '#11161D', token: 'bg-cyber-surface', desc: 'Standard card base' },
    { name: 'Surface Elevated', hex: '#181E26', token: 'bg-cyber-surface-elevated', desc: 'Modals & top level' },
    { name: 'Surface Hover', hex: '#202731', token: 'bg-cyber-surface-hover', desc: 'Interactive hover state' },
    { name: 'Border', hex: '#2A323C', token: 'border-cyber-border', desc: 'Crisp 1px boundary' },
    { name: 'Border Strong', hex: '#39434F', token: 'border-cyber-border-strong', desc: 'Prominent structural edge' },
    { name: 'Text Primary', hex: '#F2F4F7', token: 'text-cyber-primary', desc: 'Headlines & high contrast' },
    { name: 'Text Secondary', hex: '#B0B8C2', token: 'text-cyber-secondary', desc: 'Body copy & labels' },
    { name: 'Text Muted', hex: '#737D89', token: 'text-cyber-muted', desc: 'Captions & micro-labels' },
  ];

  const accentColors = [
    { name: 'Electric Cyan', hex: '#00D9FF', token: 'text-accent-cyan', bgToken: 'bg-accent-cyan', role: 'Technology, Active Navigation, System Highlights' },
    { name: 'Racing Red', hex: '#FF304F', token: 'text-accent-red', bgToken: 'bg-accent-red', role: 'Urgency, Critical Warnings, Destructive Actions' },
    { name: 'Racing Orange', hex: '#FF6A00', token: 'text-accent-orange', bgToken: 'bg-accent-orange', role: 'Active Work, In-Progress Tasks, Momentum' },
    { name: 'Racing Yellow', hex: '#FFD43B', token: 'text-accent-yellow', bgToken: 'bg-accent-yellow', role: 'Pending Reviews, Caution, Awaiting Input' },
    { name: 'Racing Lime', hex: '#10E57A', token: 'text-accent-lime', bgToken: 'bg-accent-lime', role: 'Approved Deliverables, Nominal Telemetry, Done' },
  ];

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-primary p-4 sm:p-6 lg:p-8 space-y-10 max-w-7xl mx-auto selection:bg-accent-cyan selection:text-black">
      {/* ─── Top Telemetry Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-[11px] font-mono font-bold tracking-widest uppercase">
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
            className="px-3.5 py-2 rounded-lg bg-cyber-surface-elevated border border-cyber-border hover:border-accent-cyan/50 text-xs font-mono font-bold uppercase flex items-center gap-2 cursor-pointer transition-all"
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
            <Terminal className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              1. Foundation Neutrals (Graphite & Dark Base)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyber-muted">90% OF INTERFACE FOUNDATION</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {foundationColors.map((color) => (
            <div
              key={color.name}
              onClick={() => copyToClipboard(color.hex)}
              className="p-3 rounded-xl bg-cyber-surface border border-cyber-border hover:border-accent-cyan/40 transition-all cursor-pointer group space-y-2 relative"
            >
              <div 
                className="w-full h-12 rounded-lg border border-white/10 shadow-inner flex items-center justify-center font-mono text-[11px] font-bold"
                style={{ backgroundColor: color.hex }}
              >
                {copiedColor === color.hex && (
                  <span className="bg-black/80 px-2 py-0.5 rounded text-accent-cyan text-[10px] flex items-center gap-1">
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
                <div className="font-mono text-[10px] text-cyber-muted">{color.hex}</div>
                <p className="text-[10px] text-cyber-secondary mt-1">{color.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2. PRIMARY CONTROLLED ACCENT COLORS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-orange" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              2. Controlled Semantic Accents
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyber-muted">USED WITH INTENT & RESTRAINT</span>
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
                <span className="font-mono text-[11px] text-cyber-muted">{acc.hex}</span>
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
            <Cpu className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              3. Sub-Team Technical Identifiers
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyber-muted">5 DISTINCT ENGINEERING DISCIPLINES</span>
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
                  <span className="font-mono text-[10px] text-cyber-muted uppercase tracking-wider">
                    {team.slug}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-cyber-primary">
                  {team.name.replace('Technical - ', '').replace('Operations - ', '')}
                </h4>
              </div>

              <div className="pt-2 border-t border-cyber-border flex items-center justify-between text-[10px] font-mono">
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
          <span className="text-[11px] font-mono text-cyber-muted">SHARP, RESTRAINED, 48PX TOUCH TARGETS</span>
        </div>

        <GlassCard variant="elevated" className="p-6 space-y-6">
          {/* Main 8-Variant Hierarchy Matrix */}
          <div>
            <div className="text-xs font-mono text-cyber-muted uppercase tracking-wider mb-3">
              // Core Variant Matrix
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Primary (Cyan)</span>
                <GlossyButton variant="primary" icon={<Activity className="w-4 h-4" />}>
                  Launch Sequence
                </GlossyButton>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Secondary (Elevated)</span>
                <GlossyButton variant="secondary" icon={<Layers className="w-4 h-4" />}>
                  Inspect Specs
                </GlossyButton>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Outline (Wireframe)</span>
                <GlossyButton variant="outline" icon={<Activity className="w-4 h-4" />}>
                  Telemetry View
                </GlossyButton>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Action (Orange)</span>
                <GlossyButton variant="action" icon={<Flame className="w-4 h-4" />}>
                  Execute Task
                </GlossyButton>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Warning (Yellow)</span>
                <GlossyButton variant="warning" icon={<Clock className="w-4 h-4" />}>
                  Review Queue
                </GlossyButton>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Danger (Red)</span>
                <GlossyButton variant="danger" icon={<Trash2 className="w-4 h-4" />}>
                  Delete Item
                </GlossyButton>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Metallic (Machined Alloy)</span>
                <GlossyButton variant="metallic" icon={<Sliders className="w-4 h-4" />}>
                  Hardware Switch
                </GlossyButton>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] text-cyber-muted uppercase block">// Ghost (Low Weight)</span>
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
              <GhostButton size="md" active icon={<Terminal className="w-4 h-4" />}>
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
          <span className="text-[11px] font-mono text-cyber-muted">DOUBLE-ENCODED (COLOR + ICON + LABEL)</span>
        </div>

        <GlassCard className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
              <span className="text-[10px] font-mono text-cyber-muted uppercase block">To Do / Queued</span>
              <div className="flex justify-center"><LedStatusChip status="todo" /></div>
            </div>

            <div className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
              <span className="text-[10px] font-mono text-cyber-muted uppercase block">In Progress</span>
              <div className="flex justify-center"><LedStatusChip status="in_progress" /></div>
            </div>

            <div className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
              <span className="text-[10px] font-mono text-cyber-muted uppercase block">Submitted / Review</span>
              <div className="flex justify-center"><LedStatusChip status="submitted" /></div>
            </div>

            <div className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
              <span className="text-[10px] font-mono text-cyber-muted uppercase block">Approved / Done</span>
              <div className="flex justify-center"><LedStatusChip status="approved" /></div>
            </div>

            <div className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
              <span className="text-[10px] font-mono text-cyber-muted uppercase block">Revisions Req.</span>
              <div className="flex justify-center"><LedStatusChip status="changes_requested" /></div>
            </div>

            <div className="space-y-2 text-center p-3 rounded-lg bg-cyber-surface border border-cyber-border">
              <span className="text-[10px] font-mono text-cyber-muted uppercase block">Completed</span>
              <div className="flex justify-center"><LedStatusChip status="done" /></div>
            </div>
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
          <span className="text-[11px] font-mono text-cyber-muted">CLEAN BORDERS, CYAN FOCUS RINGS</span>
        </div>

        <GlassCard className="p-6 space-y-6">
          {/* Row 1: Text Inputs & States */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <GlowInput
                label="Interactive Telemetry Input"
                placeholder="Type here to verify contrast..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                hint={`${testInput.length} chars`}
              />
              <div className="mt-1.5 text-[10px] font-mono text-cyber-muted truncate">
                Echo: <span className="text-accent-cyan font-semibold">{testInput || '(empty)'}</span>
              </div>
            </div>

            <div>
              <GlowInput
                label="University Email (Domain Restrained)"
                placeholder="engineer@zewailcity.edu.eg"
                icon={<Mail className="w-4 h-4 text-accent-cyan" />}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                hint="@zewailcity.edu.eg"
              />
              <div className="mt-1.5 text-[10px] font-mono text-accent-lime flex items-center gap-1">
                <Shield className="w-3 h-3" /> Validated ZC engineering domain
              </div>
            </div>

            <div>
              <GlowInput
                label="Validation Error State"
                placeholder="CAN-BUS ID"
                defaultValue="0x999_OVERFLOW"
                error="Value exceeds 11-bit standard telemetry identifier"
              />
            </div>
          </div>

          {/* Row 2: Selects, Date/Time & Textarea */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-cyber-border">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-accent-cyan" /> Date
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-lg text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent-cyan" /> Time
                </label>
                <input
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-lg text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyber-secondary mb-1.5">
                <span className="text-accent-cyan font-bold mr-1.5">//</span>
                Engineering Notes Textarea
              </label>
              <textarea
                rows={2}
                value={testTextarea}
                onChange={(e) => setTestTextarea(e.target.value)}
                placeholder="Technical specifications..."
                className="w-full p-2.5 rounded-lg text-xs bg-cyber-surface border border-cyber-border focus:outline-none focus:border-accent-cyan text-cyber-primary placeholder:text-cyber-muted font-sans"
              />
            </div>
          </div>

          {/* Row 3: Checkbox & Radio Controls */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-cyber-border text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={testChecked}
                onChange={(e) => setTestChecked(e.target.checked)}
                className="w-4 h-4 rounded text-accent-cyan border-cyber-border cursor-pointer"
              />
              <span className="text-cyber-primary font-semibold">Strict RLS Authorization Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-4 h-4 rounded text-accent-cyan border-cyber-border cursor-pointer"
              />
              <span className="text-cyber-secondary">Telemetry Auto-Archive</span>
            </label>

            <div className="flex items-center gap-3">
              <span className="text-cyber-muted">// Mode:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="telemetry_mode" defaultChecked className="text-accent-cyan cursor-pointer" />
                <span className="text-cyber-primary">Live</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="telemetry_mode" className="text-accent-cyan cursor-pointer" />
                <span className="text-cyber-secondary">Replay</span>
              </label>
            </div>
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
          <span className="text-[11px] font-mono text-cyber-muted">PRECISION ENGINEERING DATA READOUTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cyber-secondary uppercase">Aero Downforce Balance</span>
              <span className="font-mono font-bold text-sm text-accent-cyan">{gaugeVal}%</span>
            </div>
            <SegmentedGauge value={gaugeVal} totalSegments={10} accentColor="#00D9FF" />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setGaugeVal((v) => Math.max(0, v - 10))}
                className="px-2.5 py-1 rounded bg-cyber-surface border border-cyber-border text-xs font-mono hover:text-accent-cyan"
              >
                -10%
              </button>
              <button
                onClick={() => setGaugeVal((v) => Math.min(100, v + 10))}
                className="px-2.5 py-1 rounded bg-cyber-surface border border-cyber-border text-xs font-mono hover:text-accent-cyan"
              >
                +10%
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cyber-secondary uppercase">Battery State of Charge</span>
              <span className="font-mono font-bold text-sm text-accent-lime">88%</span>
            </div>
            <SegmentedGauge value={88} totalSegments={10} accentColor="#10E57A" />
            <span className="text-[11px] font-mono text-cyber-muted block pt-2">
              High-voltage accumulator nominal.
            </span>
          </GlassCard>

          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cyber-secondary uppercase">Brake Thermal Quota</span>
              <span className="font-mono font-bold text-sm text-accent-red">92%</span>
            </div>
            <SegmentedGauge value={92} totalSegments={10} accentColor="#FF304F" />
            <span className="text-[11px] font-mono text-accent-red block pt-2">
              WARNING: Carbon rotor temperature elevated.
            </span>
          </GlassCard>
        </div>
      </section>

      {/* ─── 8. TYPOGRAPHY MATRIX ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-cyan" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              8. Typography Hierarchy
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyber-muted">ORBITRON + EXO 2 + SHARE TECH MONO</span>
        </div>

        <GlassCard className="p-6 space-y-6">
          <div className="space-y-2 border-b border-cyber-border pb-4">
            <span className="text-[11px] font-mono text-accent-cyan uppercase block">// Orbitron — Headers & Badges</span>
            <div className="text-3xl font-display font-black tracking-wider uppercase">ZEWAIL CITY FORMULA STUDENT</div>
            <div className="text-xl font-display font-bold tracking-wide uppercase text-cyber-secondary">TELEMETRY & PROJECT MANAGEMENT WORKSPACE</div>
          </div>

          <div className="space-y-2 border-b border-cyber-border pb-4">
            <span className="text-[11px] font-mono text-accent-orange uppercase block">// Exo 2 — Body & Interface Text</span>
            <p className="text-sm font-sans text-cyber-primary leading-relaxed max-w-3xl">
              Engineered for readability in bright trackside daylight and dark workshop environments. Clear geometric proportions with crisp contrast ensure technical specifications, BOM line items, and engineering reviews are absorbed without friction.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-accent-yellow uppercase block">// Share Tech Mono — Numbers, Telemetry & Code</span>
            <div className="font-mono text-xs space-y-1 text-cyber-secondary">
              <div>// SYS.ID: ZCFS-2026-CHASSIS-004</div>
              <div>// SENSOR_TIMESTAMP: 2026-10-01T01:14:00Z // LATENCY: 12ms</div>
              <div>// ACCUMULATOR: 384.2V // CURRENT: 142.5A // TORQUE: 210 N·m</div>
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
          <span className="text-[11px] font-mono text-cyber-muted">CONSOLE // ARCHITECTURE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Rail State Preview */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <span className="text-xs font-mono font-bold text-accent-cyan uppercase">
                // Desktop Hybrid Racing Rail (72px → 288px)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                OVERLAY Z-35
              </span>
            </div>

            <p className="text-xs text-cyber-secondary leading-relaxed">
              Floating race-engineer console replacing the legacy static sidebar. Reserves a fixed left offset (<code className="text-accent-cyan">--rail-offset</code>) so the main canvas NEVER reflows or squeezes when the command center expands.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-cyber-bg-alt border border-cyber-border space-y-2">
                <span className="text-[10px] font-mono text-accent-lime font-bold uppercase block">
                  ● Collapsed (72px)
                </span>
                <ul className="text-[11px] font-mono text-cyber-muted space-y-1">
                  <li>• Lit active track node</li>
                  <li>• 48px touch targets</li>
                  <li>• Instant cyber tooltips</li>
                  <li>• 5-team status pips</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-cyber-bg-alt border border-cyber-border space-y-2">
                <span className="text-[10px] font-mono text-accent-cyan font-bold uppercase block">
                  ● Expanded (288px)
                </span>
                <ul className="text-[11px] font-mono text-cyber-muted space-y-1">
                  <li>• 120ms hover intent delay</li>
                  <li>• 250ms leave buffer</li>
                  <li>• Grouped command sections</li>
                  <li>• Pin dock on ≥1280px</li>
                </ul>
              </div>
            </div>
          </GlassCard>

          {/* Garage Door Mobile Preview */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <span className="text-xs font-mono font-bold text-accent-orange uppercase">
                // Mobile "Garage Door" Navigation (&lt;768px)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-orange/10 text-accent-orange border border-accent-orange/30">
                THUMB-ARC TAB
              </span>
            </div>

            <p className="text-xs text-cyber-secondary leading-relaxed">
              Replaces the full-width bottom bar with an edge thumb-arc glass tab (56px) that expands into a 78vh bottom sheet with a 2x3 destination grid. Content gets the full viewport height.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-cyber-bg-alt border border-cyber-border space-y-2">
                <span className="text-[10px] font-mono text-accent-yellow font-bold uppercase block">
                  ▲ Floating Tab (56px)
                </span>
                <ul className="text-[11px] font-mono text-cyber-muted space-y-1">
                  <li>• ZC telemetry mark</li>
                  <li>• Active view name</li>
                  <li>• Live connection beacon</li>
                  <li>• Safe area inset aware</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-cyber-bg-alt border border-cyber-border space-y-2">
                <span className="text-[10px] font-mono text-accent-red font-bold uppercase block">
                  ▲ Garage Door Sheet
                </span>
                <ul className="text-[11px] font-mono text-cyber-muted space-y-1">
                  <li>• 2x3 destination grid</li>
                  <li>• 64px tap targets</li>
                  <li>• Swipe-down to dismiss</li>
                  <li>• Sub-team & role info</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};
