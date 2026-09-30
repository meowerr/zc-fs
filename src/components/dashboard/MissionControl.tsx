import React from 'react';
import { 
  Clock, 
  ChevronRight, 
  Plus, 
  MessageSquare, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { EmptyState } from '../common/EmptyState';
import { Profile, Task } from '../../lib/database.types';
import { NavTab } from '../layout/BottomNav';

interface MissionControlProps {
  currentUser: Profile;
  tasks: Task[];
  onNavigateTab: (tab: NavTab) => void;
  onCreateTaskClick?: () => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  currentUser,
  tasks,
  onNavigateTab,
  onCreateTaskClick,
}) => {
  // Compute real metrics from live Supabase tasks
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const reviewCount = tasks.filter((t) => t.status === 'submitted').length;
  const approvedCount = tasks.filter((t) => t.status === 'approved' || t.status === 'done').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;

  const relevantTasks = tasks.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Hero Telemetry Banner */}
      <GlassCard variant="elevated" className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-cyber-bg-alt border border-cyber-border text-xs font-mono">
              <span className="text-accent-cyan font-bold">//</span>
              <span className="text-cyber-secondary uppercase tracking-widest text-[11px]">
                {currentUser.role === 'admin' 
                  ? 'CLUB // RACE CONTROL' 
                  : currentUser.role === 'head'
                  ? 'SUB-TEAM // PIT WALL'
                  : 'ENGINEERING // WORKSPACE'}
              </span>
              <span className="text-accent-lime text-[10px]">● LIVE</span>
            </div>

            <h2 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-cyber-primary tracking-wider uppercase">
              Mission Control & Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-cyber-secondary max-w-xl leading-relaxed">
              Motorsport engineering management, multi-version deliverable verification, and telemetry communications for Zewail City Formula Student.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {(currentUser.role === 'admin' || currentUser.role === 'head') && (
              <GlossyButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={onCreateTaskClick || (() => onNavigateTab('tasks'))}
              >
                Create Task
              </GlossyButton>
            )}
            <GlossyButton
              variant="secondary"
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => onNavigateTab('chat')}
            >
              Pit Wall Chat
            </GlossyButton>
          </div>
        </div>

        {/* Live Gauges (Derived from real Supabase task records) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-cyber-border">
          {/* Active / In Progress Metric */}
          <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-orange/40 transition-colors">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-orange opacity-70" />
            <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-accent-orange" />
                Active
              </span>
              <span className="text-[9px] text-cyber-muted tracking-tighter">P1</span>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-accent-orange mt-1">
              {inProgressCount}
            </div>
            <div className="text-[10px] font-mono text-cyber-muted mt-0.5">
              In Progress Work
            </div>
          </div>

          {/* Pending / In Review Metric */}
          <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-yellow/40 transition-colors">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-yellow opacity-70" />
            <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent-yellow" />
                In Review
              </span>
              <span className="text-[9px] text-cyber-muted tracking-tighter">QUEUE</span>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-accent-yellow mt-1">
              {reviewCount}
            </div>
            <div className="text-[10px] font-mono text-cyber-muted mt-0.5">
              Submissions Queued
            </div>
          </div>

          {/* Approved / Done Metric */}
          <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-lime/40 transition-colors">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-lime opacity-70" />
            <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime" />
                Approved
              </span>
              <span className="text-[9px] text-cyber-muted tracking-tighter">PASSED</span>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-accent-lime mt-1">
              {approvedCount}
            </div>
            <div className="text-[10px] font-mono text-cyber-muted mt-0.5">
              Deliverables Verified
            </div>
          </div>

          {/* Urgent / Critical Metric */}
          <div className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border relative overflow-hidden group hover:border-accent-red/40 transition-colors">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-accent-red opacity-70" />
            <div className="text-[11px] font-mono text-cyber-secondary uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-accent-red" />
                Critical
              </span>
              <span className="text-[9px] text-cyber-muted tracking-tighter">ALERT</span>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-accent-red mt-1">
              {urgentCount}
            </div>
            <div className="text-[10px] font-mono text-cyber-muted mt-0.5">
              Urgent / High Priority
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Active Sub-Team Tasks Feed (Live Data) */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-cyan" />
            <h3 className="font-display font-bold text-sm sm:text-base text-cyber-primary uppercase tracking-wider">
              Recent Engineering Deliverables
            </h3>
          </div>
          <GhostButton size="sm" onClick={() => onNavigateTab('tasks')}>
            <span>VIEW ALL ({tasks.length})</span>
            <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
          </GhostButton>
        </div>

        {relevantTasks.length === 0 ? (
          <EmptyState
            illustration="telemetry"
            title="NO ACTIVE DELIVERABLES"
            description="All deliverables for your sub-team scope are currently clear or waiting for dispatch."
            actionLabel={currentUser.role === 'admin' || currentUser.role === 'head' ? 'CREATE FIRST DELIVERABLE' : undefined}
            onAction={onCreateTaskClick || (() => onNavigateTab('tasks'))}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relevantTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigateTab('tasks')}
                className="p-3.5 rounded-lg bg-cyber-bg-alt border border-cyber-border hover:border-accent-cyan/50 transition-all space-y-2.5 cursor-pointer group shadow-cyber-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-cyber-muted">
                      {t.task_type} // {t.priority}
                    </span>
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-cyber-primary group-hover:text-accent-cyan transition-colors leading-snug truncate">
                      {t.title}
                    </h4>
                  </div>
                  <LedStatusChip status={t.status} size="sm" />
                </div>

                {t.description && (
                  <p className="text-xs text-cyber-secondary line-clamp-1 leading-relaxed">
                    {t.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-cyber-border text-[11px] font-mono text-cyber-muted">
                  <span>DUE: {new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  <span className="text-accent-cyan group-hover:translate-x-0.5 transition-transform flex items-center">
                    OPEN <ChevronRight className="w-3 h-3 ml-0.5 inline" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
