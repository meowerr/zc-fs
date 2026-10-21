import React from 'react';
import { ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { ZfsLogo } from '../brand/ZfsLogo';
import { Profile } from '../../lib/database.types';

interface PendingApprovalViewProps {
  user: Profile;
  onSignOut: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  user,
  onSignOut,
}) => {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-cyber-bg text-cyber-primary relative overflow-hidden">
      {/* Background Subtle Tech-Grid Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-lg space-y-4 relative z-10">
        <div className="relative">
          {/* Aerospace Corner Brackets (Echoing Logo Source Slide) */}
          <span className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-brand-orange pointer-events-none z-20" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-brand-orange pointer-events-none z-20" />
          <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-brand-orange pointer-events-none z-20" />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-brand-orange pointer-events-none z-20" />

          <GlassCard variant="elevated" className="p-6 sm:p-8 text-center border-cyber-border-strong shadow-cyber-elevated relative overflow-hidden space-y-4">
            {/* Full ZFS Lockup */}
            <div className="w-full max-w-[220px] sm:max-w-[260px] mx-auto py-1">
              <ZfsLogo variant="full" glow={true} className="w-full h-auto drop-shadow-xl" />
            </div>

            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 pt-1">
              <LedStatusChip status="pending" customLabel="GATEWAY LOCKED • PENDING APPROVAL" size="sm" />
            </div>

            {/* Branded Welcome Message */}
            <div className="space-y-1.5">
              <h2 className="font-display font-black text-xl sm:text-2xl text-cyber-primary uppercase tracking-wider">
                You're in the queue, ZFS will approve you soon
              </h2>
              <p className="text-xs sm:text-sm font-sans text-cyber-secondary leading-relaxed">
                Welcome to the team, <strong className="text-cyber-primary">{user.full_name}</strong>. Your university email (<span className="font-mono text-accent-cyan font-medium">{user.email}</span>) has been authenticated. A Club Administrator will assign your sub-team division shortly.
              </p>
            </div>

            {/* Security & Access Scope Info */}
            <div className="p-3.5 rounded-xl bg-cyber-bg-alt border border-cyber-border text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-cyber-primary uppercase">
                <ShieldAlert className="w-4 h-4 text-accent-yellow shrink-0" />
                <span>Data Isolation & Protection Active:</span>
              </div>
              <ul className="text-xs text-cyber-secondary space-y-1 pl-5 list-disc font-sans">
                <li>PostgreSQL Row Level Security (RLS) protects CAD designs and vehicle telemetry.</li>
                <li>Sub-team channels and task assignments require an administrator roster approval.</li>
                <li>Your access unlocks automatically without needing to re-register.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-label font-mono text-accent-lime">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Identity Verified</span>
              </div>
              <span className="text-cyber-border">•</span>
              <GhostButton
                icon={<LogOut className="w-4 h-4" />}
                onClick={onSignOut}
                className="text-xs"
              >
                SIGN OUT
              </GhostButton>
            </div>
          </GlassCard>
        </div>

        {/* Technical Footer */}
        <div className="text-center font-mono text-label text-cyber-muted">
          Built for Zewail Formula Team • PitLane Workspace
        </div>
      </div>
    </div>
  );
};
