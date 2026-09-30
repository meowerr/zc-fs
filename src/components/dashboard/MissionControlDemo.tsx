import React, { useState } from 'react';
import { 
  Sparkles, 
  Gauge, 
  Clock, 
  ChevronRight, 
  Plus, 
  MessageSquare, 
  ShieldCheck, 
  Send
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { SegmentedGauge } from '../common/SegmentedGauge';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { GlowInput } from '../common/GlowInput';
import { UserRole, TaskStatus } from '../../lib/database.types';
import { NavTab } from '../layout/BottomNav';

interface MissionControlDemoProps {
  currentRole: UserRole;
  onChangeRole: (newRole: UserRole) => void;
  activeTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const MissionControlDemo: React.FC<MissionControlDemoProps> = ({
  currentRole,
  onChangeRole,
  activeTab,
  onNavigateTab,
}) => {
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [quickInput, setQuickInput] = useState('');

  // Sample Formula Student Tasks for Demo
  const demoTasks = [
    {
      id: 'TASK-01',
      title: 'Double Wishbone Kinematics Simulation',
      group: 'Vehicle Dynamics',
      type: 'Design',
      priority: 'high' as const,
      status: 'in_progress' as TaskStatus,
      deadline: 'Tomorrow, 18:00',
      progress: 65,
      assignee: 'Mostafa Ibrahim',
    },
    {
      id: 'TASK-02',
      title: 'Front Wing Endplate Airfoil Meshing (20 m/s)',
      group: 'Aerodynamics',
      type: 'Code',
      priority: 'urgent' as const,
      status: 'submitted' as TaskStatus,
      deadline: 'In 3 days',
      progress: 100,
      assignee: 'Nour El-Din',
    },
    {
      id: 'TASK-03',
      title: 'Telemetry CAN Bus Packet Decoder Script',
      group: 'LV Electronics',
      type: 'Code',
      priority: 'medium' as const,
      status: 'changes_requested' as TaskStatus,
      deadline: 'Oct 04, 2026',
      progress: 80,
      assignee: 'Hassan Sherif',
    },
    {
      id: 'TASK-04',
      title: 'FSAE BOM Cost Report Chapter 4 Submissions',
      group: 'Business & Ops',
      type: 'Report',
      priority: 'low' as const,
      status: 'approved' as TaskStatus,
      deadline: 'Completed',
      progress: 100,
      assignee: 'Farah Tarek',
    },
  ];

  // If user is pending, show the gate screen immediately
  if (currentRole === 'pending') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <GlassCard variant="elevated" className="p-8 sm:p-10 border-telemetry-amber/50">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-telemetry-amber/20 border border-telemetry-amber/40 flex items-center justify-center text-telemetry-amber shadow-[0_0_20px_rgba(255,197,61,0.3)]">
            <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <h2 className="font-display font-black text-xl sm:text-2xl text-chrome-900 dark:text-white uppercase tracking-wider mb-2">
            Awaiting Club Admin Approval
          </h2>

          <p className="text-sm font-sans text-chrome-900/70 dark:text-white/70 mb-6 leading-relaxed">
            Your university account <span className="font-mono text-telemetry-blue dark:text-telemetry-aqua font-semibold">@zewailcity.edu.eg</span> has been verified. A Club Admin will assign your Formula Student sub-team and role shortly.
          </p>

          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 mb-6 text-left">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-chrome-900/60 dark:text-white/50">GATEWAY STATUS:</span>
              <LedStatusChip status="pending" customLabel="PENDING APPROVAL" size="sm" />
            </div>
            <div className="text-xs text-chrome-900/80 dark:text-white/70">
              Access to sub-team channels, telemetry data, and CAD repositories is locked by Row Level Security until assigned.
            </div>
          </div>

          {/* Role switcher for easy demo verification */}
          <div className="pt-4 border-t border-chrome-300/60 dark:border-white/10">
            <p className="text-xs font-mono text-chrome-900/50 dark:text-white/40 mb-3">
              [DEVELOPER DEMO SWITCHER]
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <GlossyButton size="sm" variant="holo" onClick={() => onChangeRole('admin')}>
                Switch to Club Admin
              </GlossyButton>
              <GlossyButton size="sm" variant="primary" onClick={() => onChangeRole('head')}>
                Switch to Group Head
              </GlossyButton>
              <GlossyButton size="sm" variant="secondary" onClick={() => onChangeRole('member')}>
                Switch to Member
              </GlossyButton>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Switcher Toolbar for Verification */}
      <GlassCard variant="telemetry" className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-chrome-900/60 dark:text-white/50 uppercase font-semibold">
              Live Role Persona:
            </span>
            <LedStatusChip status="online" customLabel={currentRole.toUpperCase()} size="sm" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['admin', 'head', 'member', 'pending'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => onChangeRole(r)}
                className={`
                  px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition-all cursor-pointer
                  ${
                    currentRole === r
                      ? 'bg-telemetry-blue text-white shadow-neon-blue'
                      : 'bg-white/60 dark:bg-white/10 text-chrome-900 dark:text-white hover:bg-white'
                  }
                `}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* TAB 1: MISSION CONTROL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Hero Telemetry Card */}
          <GlassCard variant="accent" className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-chrome-300 dark:border-white/20 text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-telemetry-pink" />
                  <span className="font-bold text-telemetry-blue dark:text-telemetry-aqua">
                    PHASE 0: FOUNDATION ONLINE
                  </span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-chrome-900 dark:text-white tracking-wide uppercase">
                  Telemetry & Mission Control
                </h2>
                <p className="text-sm text-chrome-900/70 dark:text-white/70 max-w-xl">
                  Motorsport project management workspace for Zewail City Formula Student. 
                  Realtime task tracking, deliverables review, and cross-team telemetry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <GlossyButton
                  variant="holo"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => onNavigateTab('tasks')}
                >
                  Create Task
                </GlossyButton>
                <GlossyButton
                  variant="secondary"
                  icon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => onNavigateTab('chat')}
                >
                  Open Pit Wall
                </GlossyButton>
              </div>
            </div>

            {/* Quick Stat Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-chrome-300/60 dark:border-white/10">
              <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
                <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Active Sprint</div>
                <div className="text-xl font-display font-bold text-telemetry-blue mt-0.5">Sprint #4</div>
                <div className="text-[10px] font-mono text-telemetry-lime mt-1">Car Chassis Stage</div>
              </div>
              <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
                <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Tasks In Progress</div>
                <div className="text-xl font-display font-bold text-chrome-900 dark:text-white mt-0.5">14</div>
                <div className="text-[10px] font-mono text-telemetry-aqua mt-1">4 Awaiting Review</div>
              </div>
              <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
                <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Team Velocity</div>
                <div className="text-xl font-display font-bold text-telemetry-lime mt-0.5">88%</div>
                <div className="text-[10px] font-mono text-[#8ED91E] mt-1">+12% vs last week</div>
              </div>
              <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
                <div className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 uppercase">Competition Countdown</div>
                <div className="text-xl font-display font-bold text-telemetry-pink mt-0.5">112 Days</div>
                <div className="text-[10px] font-mono text-chrome-900/60 dark:text-white/50 mt-1">Formula Student UK</div>
              </div>
            </div>
          </GlassCard>

          {/* Active Tasks Telemetry Preview */}
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-telemetry-blue" />
                <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
                  Active Sub-Team Tasks
                </h3>
              </div>
              <GhostButton size="sm" onClick={() => onNavigateTab('tasks')}>
                View All <ChevronRight className="w-4 h-4 ml-1 inline" />
              </GhostButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 hover:border-telemetry-blue/50 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-chrome-900/50 dark:text-white/40 block">
                        {t.id} • {t.group}
                      </span>
                      <h4 className="font-sans font-bold text-sm text-chrome-900 dark:text-white leading-snug mt-0.5">
                        {t.title}
                      </h4>
                    </div>
                    <LedStatusChip status={t.status} size="sm" />
                  </div>

                  <SegmentedGauge value={t.progress} totalSegments={8} label="Deliverable Progress" />

                  <div className="flex items-center justify-between pt-2 border-t border-chrome-300/40 dark:border-white/5 text-xs font-mono text-chrome-900/60 dark:text-white/50">
                    <span className="flex items-center gap-1.5">
                      <ChromeAvatar name={t.assignee} size="sm" role="member" />
                      <span className="truncate max-w-[120px]">{t.assignee}</span>
                    </span>
                    <span className="flex items-center gap-1 text-telemetry-amber font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {t.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: TASKS TELEMETRY VIEW */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <GlassCard className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-lg text-chrome-900 dark:text-white uppercase tracking-wider">
                  Task Management Telemetry
                </h3>
                <p className="text-xs text-chrome-900/60 dark:text-white/50">
                  Deliverable tracking across 5 sub-teams with review workflows
                </p>
              </div>

              <div className="flex items-center gap-2">
                <GlossyButton size="sm" variant="holo" icon={<Plus className="w-3.5 h-3.5" />}>
                  New Task
                </GlossyButton>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-chrome-300/60 dark:border-white/10">
              {['all', 'in_progress', 'submitted', 'changes_requested', 'approved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`
                    px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase transition-all cursor-pointer
                    ${
                      taskFilter === f
                        ? 'bg-telemetry-blue text-white shadow-sm'
                        : 'bg-white/40 dark:bg-white/5 text-chrome-900/70 dark:text-white/70 hover:bg-white/70'
                    }
                  `}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Task Feed */}
          <div className="space-y-3">
            {demoTasks.map((t) => (
              <GlassCard key={t.id} className="p-4 hover:shadow-lg transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-telemetry-blue dark:text-telemetry-aqua">
                        {t.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/5 dark:bg-white/10 text-chrome-900/80 dark:text-white/80">
                        {t.type}
                      </span>
                      <span className="text-xs text-chrome-900/60 dark:text-white/50">
                        • {t.group}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-chrome-900 dark:text-white">
                      {t.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <LedStatusChip status={t.status} />
                    <GlossyButton size="sm" variant="secondary">
                      View Details
                    </GlossyButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PIT WALL CHAT VIEW */}
      {activeTab === 'chat' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-chrome-300/60 dark:border-white/10">
            <div>
              <h3 className="font-display font-bold text-lg text-chrome-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-telemetry-blue" />
                Pit Wall Telemetry Channels
              </h3>
              <p className="text-xs text-chrome-900/60 dark:text-white/50">
                Realtime communication: Sub-team channels, Heads-Only Pit Wall, and Announcements
              </p>
            </div>
            <LedStatusChip status="online" customLabel="WEBSOCKET CONNECTED" size="sm" />
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-telemetry-blue"># VD Telemetry & Comms</span>
                <span className="text-chrome-900/40 dark:text-white/40">10:42 AM</span>
              </div>
              <p className="text-sm text-chrome-900/80 dark:text-white/80">
                <span className="font-semibold text-chrome-900 dark:text-white">Kareem (Head):</span> Updated suspension pickup coordinates uploaded to CAD repository. Please check clearance with front bulkhead.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-telemetry-pink"># Pit Wall (Heads Only)</span>
                <span className="text-chrome-900/40 dark:text-white/40">09:15 AM</span>
              </div>
              <p className="text-sm text-chrome-900/80 dark:text-white/80">
                <span className="font-semibold text-chrome-900 dark:text-white">Mariam (Aero Head):</span> We need the front tire envelope from Vehicle Dynamics before final CFD wing meshing.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <GlowInput
              placeholder="Send message to channel or teammates..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
            />
            <GlossyButton variant="primary" icon={<Send className="w-4 h-4" />}>
              Send
            </GlossyButton>
          </div>
        </GlassCard>
      )}

      {/* TAB 4: TEAM DIRECTORY */}
      {activeTab === 'team' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-chrome-300/60 dark:border-white/10">
            <div>
              <h3 className="font-display font-bold text-lg text-chrome-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8ED91E]" />
                5 Formula Student Sub-Teams Directory
              </h3>
              <p className="text-xs text-chrome-900/60 dark:text-white/50">
                Scoped members, group heads, and technical roles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Vehicle Dynamics', count: 12, head: 'Kareem Tarek', color: '#2F6BFF' },
              { name: 'Aerodynamics', count: 9, head: 'Mariam Adel', color: '#22E4F0' },
              { name: 'Low-Voltage Electronics', count: 11, head: 'Omar Yasser', color: '#FFC53D' },
              { name: 'Powertrain & Drivetrain', count: 14, head: 'Ahmed Hesham', color: '#FF4FA3' },
              { name: 'Operations & Business', count: 8, head: 'Salma Khaled', color: '#B6FF3B' },
            ].map((team) => (
              <div key={team.name} className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-chrome-900 dark:text-white">
                    {team.name}
                  </h4>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10" style={{ color: team.color }}>
                    {team.count} Engineers
                  </span>
                </div>
                <div className="text-xs text-chrome-900/70 dark:text-white/60">
                  <span className="font-semibold">Sub-team Head:</span> {team.head}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* TAB 5: ADMIN HUB */}
      {activeTab === 'admin' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-chrome-300/60 dark:border-white/10">
            <div>
              <h3 className="font-display font-bold text-lg text-chrome-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-telemetry-pink" />
                Club Admin Control Hub
              </h3>
              <p className="text-xs text-chrome-900/60 dark:text-white/50">
                Pending registrations, role assignments, and sub-team management
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-telemetry-pink/15 text-telemetry-pink border border-telemetry-pink/40">
              3 PENDING REGISTRATIONS
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Ziad Mohamed', email: 's-ziad.mohamed@zewailcity.edu.eg', date: '10 mins ago' },
              { name: 'Youssef El-Sayed', email: 's-youssef.elsayed@zewailcity.edu.eg', date: '1 hour ago' },
            ].map((p, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-chrome-900 dark:text-white">{p.name}</div>
                  <div className="font-mono text-xs text-telemetry-blue dark:text-telemetry-aqua">{p.email}</div>
                  <div className="text-[10px] text-chrome-900/50 dark:text-white/40 mt-0.5">Applied {p.date}</div>
                </div>

                <div className="flex items-center gap-2">
                  <GlossyButton size="sm" variant="success">
                    Approve & Assign
                  </GlossyButton>
                  <GhostButton size="sm">
                    Reject
                  </GhostButton>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
