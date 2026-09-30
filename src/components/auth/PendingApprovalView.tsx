import React from 'react';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-cyber-bg text-cyber-primary relative">
      {/* Background Subtle Tech-Grid Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="w-full max-w-lg space-y-4 relative z-10">
        <GlassCard variant="elevated" className="p-6 sm:p-7 text-center border-accent-yellow/40 shadow-cyber-elevated">
          {/* Animated Telemetry Radar Disc */}
          <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-accent-yellow/20 animate-ping opacity-30" />
            <div className="w-14 h-14 rounded-lg bg-accent-yellow/10 border border-accent-yellow/40 flex items-center justify-center text-accent-yellow shadow-[0_0_15px_rgba(255,212,59,0.2)]">
              <Clock className="w-7 h-7" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 mb-3">
            <LedStatusChip status="pending" customLabel="GATEWAY LOCKED // PENDING APPROVAL" size="sm" />
          </div>

          <h2 className="font-display font-black text-xl sm:text-2xl text-cyber-primary uppercase tracking-wider mb-2">
            Awaiting Sub-Team Assignment
          </h2>

          <p className="text-xs sm:text-sm font-sans text-cyber-secondary leading-relaxed mb-5">
            Welcome, <span className="font-bold text-cyber-primary">{user.full_name}</span>. 
            Your university identity <span className="font-mono text-accent-cyan font-semibold">{user.email}</span> has been authenticated. 
            The Club Admin must assign you to an official sub-team roster before telemetry telemetry is unlocked.
          </p>

          {/* Security & Access Scope Info */}
          <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border text-left space-y-2 mb-5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyber-primary uppercase">
              <ShieldAlert className="w-4 h-4 text-accent-yellow" />
              <span>Data Protection Protocols Active:</span>
            </div>
            <ul className="text-xs text-cyber-secondary space-y-1 pl-5 list-disc font-sans">
              <li>Postgres Row Level Security (RLS) protects CAD models & telemetry.</li>
              <li>Team channels require an assigned sub-team group ID.</li>
              <li>Workspace access activates immediately upon admin assignment.</li>
            </ul>
          </div>

          <div className="flex items-center justify-center">
            <GhostButton
              icon={<LogOut className="w-4 h-4" />}
              onClick={onSignOut}
            >
              SIGN OUT
            </GhostButton>
          </div>
        </GlassCard>

        {/* Technical Footer */}
        <div className="text-center font-mono text-[10px] text-cyber-muted uppercase tracking-widest">
          Zewail City Racing Team // Telemetry Engine v1.0
        </div>
      </div>
    </div>
  );
};
