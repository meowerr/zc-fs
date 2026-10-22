import React, { useState } from 'react';
import { ArrowLeft, FileText, Lock, CheckCircle2 } from 'lucide-react';
import { ZfsLogo } from '../brand/ZfsLogo';
import { GlassCard } from '../common/GlassCard';
import { GhostButton } from '../common/GhostButton';

export interface LegalViewProps {
  initialTab?: 'privacy' | 'terms';
  onBack: () => void;
}

const PRIVACY_ITEMS = [
  {
    num: '01',
    title: 'Scope & Authorization',
    body: 'PitLane internal telemetry is restricted to authenticated @zewailcity.edu.eg engineering credentials.',
  },
  {
    num: '02',
    title: 'Telemetry & Engineering Data',
    body: 'We collect member profiles, task progress, and vehicle telemetry to coordinate Formula Student development.',
  },
  {
    num: '03',
    title: 'Database-Level Row Security (RLS)',
    body: 'PostgreSQL RLS policies strictly enforce access boundaries. Clients cannot query records outside role grants.',
  },
  {
    num: '04',
    title: 'Zero Commercial Tracking',
    body: 'PitLane operates on 100% free engineering tiers with zero ads or third-party telemetry trackers.',
  },
];

const TERMS_ITEMS = [
  {
    num: '01',
    title: 'Team Protocols',
    body: 'Members agree to safety directives and official Formula SAE / Formula Student engineering rules.',
  },
  {
    num: '02',
    title: 'Intellectual Property & CAD',
    body: 'All CAD models, CFD scans, telemetry, and designs remain exclusive property of ZFS Racing Team.',
  },
  {
    num: '03',
    title: 'Sub-Team Accountability',
    body: 'Admins oversee system integrity. Group Heads coordinate deliverables. Members maintain telemetry accuracy.',
  },
];

export const LegalView: React.FC<LegalViewProps> = ({
  initialTab = 'privacy',
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);
  const items = activeTab === 'privacy' ? PRIVACY_ITEMS : TERMS_ITEMS;

  return (
    <div className="min-h-dvh bg-cyber-bg text-cyber-primary p-4 sm:p-6 md:p-8 relative">
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyber-border">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Return to PitLane Workspace"
              className="p-2 rounded-lg bg-cyber-surface border border-cyber-border hover:border-brand-orange/60 text-cyber-muted hover:text-cyber-primary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <ZfsLogo variant="horizontal" glow={false} className="h-6 sm:h-7 w-auto" />
              <span className="hidden sm:inline-block font-mono text-xs text-cyber-muted">•</span>
              <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase text-cyber-primary">
                LEGAL & COMPLIANCE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-cyber-surface border border-cyber-border shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-brand-orange text-brand-ink shadow-cyber-sm'
                  : 'text-cyber-muted hover:text-cyber-primary'
              }`}
            >
              PRIVACY POLICY
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-brand-orange text-brand-ink shadow-cyber-sm'
                  : 'text-cyber-muted hover:text-cyber-primary'
              }`}
            >
              TERMS OF SERVICE
            </button>
          </div>
        </div>

        <GlassCard variant="elevated" className="p-6 sm:p-8 space-y-6 text-sm leading-relaxed border-cyber-border">
          <article className="space-y-6">
            <div className="space-y-2 pb-4 border-b border-cyber-border">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-brand-orange/15 text-brand-light-orange border border-brand-orange/30 font-mono text-xs font-medium uppercase">
                {activeTab === 'privacy' ? <Lock className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {activeTab === 'privacy' ? 'DATA PROTECTION & SECURITY PROTOCOL' : 'MOTORSPORT TEAM AGREEMENT'}
              </div>
              <h1 className="font-display font-black text-xl sm:text-2xl text-cyber-primary uppercase tracking-wider">
                {activeTab === 'privacy' ? 'PitLane Privacy Policy' : 'Terms of Service & Engineering Protocol'}
              </h1>
              <p className="font-mono text-xs text-cyber-muted">
                Formula Student Racing Season 2026 // Zewail City Formula Student Racing Team
              </p>
            </div>

            {items.map((sec) => (
              <section key={sec.num} className="space-y-2">
                <h2 className="font-sans font-semibold text-base text-cyber-primary flex items-center gap-2">
                  <span className="text-brand-orange font-mono text-xs">{sec.num} •</span> {sec.title}
                </h2>
                <p className="text-cyber-secondary leading-relaxed">{sec.body}</p>
              </section>
            ))}
          </article>

          <div className="pt-6 border-t border-cyber-border flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyber-muted">
              <CheckCircle2 className="w-4 h-4 text-accent-lime" />
              <span>Complies with Formula Student Engineering Safety Standards</span>
            </div>
            <GhostButton size="sm" onClick={onBack}>
              Return to PitLane
            </GhostButton>
          </div>
        </GlassCard>

        <footer className="pt-4 pb-8 text-center text-xs font-mono text-text-muted select-none">
          Built for Zewail Formula Team // PitLane Telemetry
        </footer>
      </div>
    </div>
  );
};

export default LegalView;
