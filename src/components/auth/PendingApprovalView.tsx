import React from 'react';
import { Clock, LogOut } from 'lucide-react';
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
    <main className="min-h-screen flex items-center justify-center p-4 bg-cyber-bg text-cyber-primary relative">
      {/* Background Subtle Tech-Grid Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]" aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="w-full max-w-lg space-y-4 relative z-10">
        <GlassCard variant="elevated" className="p-6 sm:p-7 text-center border-accent-yellow/40 shadow-cyber-elevated">
          <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-accent-yellow/10 border border-accent-yellow/40 flex items-center justify-center text-accent-yellow" aria-hidden="true">
            <Clock className="w-7 h-7" />
          </div>

          <div className="mb-3">
            <LedStatusChip status="pending" customLabel="Awaiting approval" size="sm" />
          </div>

          <h1 className="font-display font-black text-xl sm:text-2xl text-cyber-primary tracking-wide mb-2">
            You&apos;re almost on the grid
          </h1>

          <p className="text-sm text-cyber-secondary leading-relaxed mb-6 max-w-sm mx-auto">
            Thanks, <span className="font-semibold text-cyber-primary">{user.full_name}</span>. Your account{' '}
            <span className="font-mono text-accent-cyan break-all">{user.email}</span> is verified. A club admin now needs to
            assign you to a sub-team.
          </p>

          <ol className="p-4 rounded-lg bg-cyber-bg-alt border border-cyber-border text-left space-y-3 mb-6">
            {[
              { title: 'Account verified', body: 'Your university email is confirmed.', done: true },
              { title: 'Sub-team assignment', body: 'An admin reviews new members, usually within a day.', done: false },
              { title: 'Workspace unlocked', body: 'Tasks, team channels and files open automatically.', done: false },
            ].map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-2xs font-mono font-bold border ${
                    step.done ? 'bg-accent-lime/15 border-accent-lime/40 text-accent-lime' : 'border-cyber-border-strong text-cyber-muted'
                  }`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-cyber-primary">
                    {step.title}
                    {step.done && <span className="sr-only"> (complete)</span>}
                  </span>
                  <span className="block text-xs text-cyber-secondary">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-center">
            <GhostButton
              icon={<LogOut className="w-4 h-4" />}
              onClick={onSignOut}
            >
              Sign out
            </GhostButton>
          </div>
        </GlassCard>

        <p className="text-center text-xs text-cyber-muted">
          This page updates automatically once you&apos;re approved.
        </p>
      </div>
    </main>
  );
};
