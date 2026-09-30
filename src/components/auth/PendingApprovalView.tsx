import React from 'react';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { Profile } from '../../lib/database.types';

interface PendingApprovalViewProps {
  user: Profile;
  onSignOut: () => void;
  onSwitchToAdmin?: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  user,
  onSignOut,
  onSwitchToAdmin,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-chrome-100 to-chrome-50 dark:from-midnight-950 dark:to-midnight-900">
      <div className="w-full max-w-lg space-y-4">
        <GlassCard variant="elevated" className="p-6 sm:p-8 text-center border-telemetry-amber/40 shadow-xl">
          {/* Animated Telemetry Radar Disc */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-telemetry-amber/30 animate-ping opacity-30" />
            <div className="w-16 h-16 rounded-full bg-telemetry-amber/15 border border-telemetry-amber/50 flex items-center justify-center text-telemetry-amber shadow-[0_0_25px_rgba(255,197,61,0.25)]">
              <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-telemetry-amber/15 text-telemetry-amber border border-telemetry-amber/40 text-xs font-mono font-bold mb-3">
            <LedStatusChip status="pending" customLabel="GATEWAY LOCKED • PENDING REVIEW" size="sm" />
          </div>

          <h2 className="font-display font-black text-2xl text-chrome-900 dark:text-white uppercase tracking-wider mb-2">
            Awaiting Sub-Team Assignment
          </h2>

          <p className="text-sm font-sans text-chrome-900/70 dark:text-white/70 leading-relaxed mb-6">
            Welcome, <span className="font-bold text-chrome-900 dark:text-white">{user.full_name}</span>. 
            Your university identity <span className="font-mono text-telemetry-blue dark:text-telemetry-aqua font-semibold">{user.email}</span> has been verified. 
            The Club Admin must assign you to one of the 5 official Formula Student sub-teams before workspace telemetry is unlocked.
          </p>

          {/* Security & Access Scope Info */}
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-chrome-900/80 dark:text-white/80 uppercase">
              <ShieldAlert className="w-4 h-4 text-telemetry-amber" />
              <span>Data Protection Protocols Active:</span>
            </div>
            <ul className="text-xs text-chrome-900/70 dark:text-white/60 space-y-1 pl-6 list-disc font-sans">
              <li>Postgres Row Level Security (RLS) restricts CAD & telemetry models.</li>
              <li>Sub-team communication channels require an assigned group ID.</li>
              <li>You will receive active access immediately upon Club Admin confirmation.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <GhostButton
              icon={<LogOut className="w-4 h-4" />}
              onClick={onSignOut}
            >
              Sign Out
            </GhostButton>

            {onSwitchToAdmin && (
              <GlossyButton
                variant="holo"
                size="md"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={onSwitchToAdmin}
              >
                Switch to Admin Hub
              </GlossyButton>
            )}
          </div>
        </GlassCard>

        {/* Technical Footer */}
        <div className="text-center font-mono text-[10px] text-chrome-900/40 dark:text-white/30 uppercase tracking-widest">
          Zewail City Racing Team • Telemetry Engine v1.0
        </div>
      </div>
    </div>
  );
};
