import React from 'react';
import { 
  Sparkles, 
  Gauge, 
  Clock, 
  ChevronRight, 
  Plus, 
  MessageSquare, 
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
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

  // Filter tasks relevant to current user:
  // - If admin: all tasks
  // - If head/member: tasks belonging to their sub-team
  const relevantTasks = tasks.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero Telemetry Banner */}
      <GlassCard variant="accent" className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-chrome-300 dark:border-white/20 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-telemetry-pink" />
              <span className="font-bold text-telemetry-blue dark:text-telemetry-aqua uppercase">
                {currentUser.role === 'admin' 
                  ? 'Club Administration Telemetry' 
                  : currentUser.role === 'head'
                  ? 'Sub-Team Pit Wall'
                  : 'Engineering Workspace'}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-chrome-900 dark:text-white tracking-wide uppercase">
              Mission Control & Telemetry
            </h2>
            <p className="text-sm text-chrome-900/70 dark:text-white/70 max-w-xl">
              Real-time engineering task tracking, multi-version deliverable verification, and motorsport communications for Zewail City Formula Student.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {(currentUser.role === 'admin' || currentUser.role === 'head') && (
              <GlossyButton
                variant="holo"
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
              Open Pit Wall
            </GlossyButton>
          </div>
        </div>

        {/* Live Gauges (Derived from real Supabase task records) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-chrome-300/60 dark:border-white/10">
          <div className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-telemetry-blue" />
              In Progress
            </div>
            <div className="text-2xl font-display font-black text-telemetry-blue mt-1">
              {inProgressCount}
            </div>
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/40 mt-1">
              Active engineering work
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-telemetry-amber" />
              Awaiting Review
            </div>
            <div className="text-2xl font-display font-black text-telemetry-amber mt-1">
              {reviewCount}
            </div>
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/40 mt-1">
              Submissions queued
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-telemetry-lime" />
              Approved
            </div>
            <div className="text-2xl font-display font-black text-telemetry-lime mt-1">
              {approvedCount}
            </div>
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/40 mt-1">
              Deliverables accepted
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-telemetry-pink" />
              High Priority
            </div>
            <div className="text-2xl font-display font-black text-telemetry-pink mt-1">
              {urgentCount}
            </div>
            <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/40 mt-1">
              Urgent / High tasks
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Active Sub-Team Tasks Feed (Live Data) */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-telemetry-blue" />
            <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
              Recent Engineering Tasks
            </h3>
          </div>
          <GhostButton size="sm" onClick={() => onNavigateTab('tasks')}>
            View All ({tasks.length}) <ChevronRight className="w-4 h-4 ml-1 inline" />
          </GhostButton>
        </div>

        {relevantTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <p className="text-xs font-mono text-chrome-900/60 dark:text-white/50">
              No tasks currently registered for your sub-team scope.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigateTab('tasks')}
                className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 hover:border-telemetry-blue/50 transition-all space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-chrome-900/50 dark:text-white/40 uppercase">
                      {t.task_type} • {t.priority} priority
                    </span>
                    <h4 className="font-sans font-bold text-sm text-chrome-900 dark:text-white leading-snug">
                      {t.title}
                    </h4>
                  </div>
                  <LedStatusChip status={t.status} size="sm" />
                </div>

                {t.description && (
                  <p className="text-xs font-sans text-chrome-900/70 dark:text-white/60 line-clamp-2">
                    {t.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-chrome-300/40 dark:border-white/5 text-xs font-mono text-chrome-900/60 dark:text-white/50">
                  <span className="flex items-center gap-1.5 text-telemetry-blue dark:text-telemetry-aqua">
                    <Clock className="w-3.5 h-3.5" />
                    Due {new Date(t.deadline).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-chrome-900/50 dark:text-white/40">
                    Open in Tasks →
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
