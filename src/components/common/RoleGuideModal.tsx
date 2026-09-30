import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  Layers, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { GhostButton } from './GhostButton';
import { UserRole } from '../../lib/database.types';

interface RoleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const RoleGuideModal: React.FC<RoleGuideModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'member',
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    defaultRole === 'pending' ? 'member' : defaultRole
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <GlassCard variant="elevated" className="w-full max-w-2xl max-h-[90vh] flex flex-col p-6 border-telemetry-blue/40 shadow-2xl my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-chrome-300/60 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-telemetry-blue/15 text-telemetry-blue">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-chrome-900 dark:text-white uppercase tracking-wider">
                PitLane Engineering Protocol
              </h3>
              <p className="text-xs font-mono text-chrome-900/60 dark:text-white/50">
                Formula Student Role Operations Guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-chrome-900/60 dark:text-white/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1.5 my-3 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 flex-shrink-0">
          {(['member', 'head', 'admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedRole === r
                  ? 'bg-white dark:bg-midnight-800 text-telemetry-blue dark:text-telemetry-aqua shadow-sm'
                  : 'text-chrome-900/60 dark:text-white/50 hover:text-chrome-900'
              }`}
            >
              {r === 'admin' ? 'Club Admin' : r === 'head' ? 'Group Head' : 'Member (Engineer)'}
            </button>
          ))}
        </div>

        {/* Role Guide Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm font-sans leading-relaxed">
          {selectedRole === 'member' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <Layers className="w-4 h-4 text-telemetry-blue" />
                  <span>1. Working on Sub-Team Deliverables</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  You belong to exactly one official sub-team (e.g., Vehicle Dynamics). In the <strong>Tasks</strong> tab, you can view your assigned tasks, review CAD/code references, and update status from <code>To Do</code> to <code>In Progress</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <CheckCircle2 className="w-4 h-4 text-[#8ED91E]" />
                  <span>2. Submitting Deliverables & Multi-Version History</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  Click on any assigned task and select <strong>"Submit Work Deliverable"</strong>. You can attach GitHub PRs, Onshape CAD links, or upload files up to 25 MB. Every resubmission creates a new version (<code>v1</code>, <code>v2</code>) preserving feedback history.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <MessageSquare className="w-4 h-4 text-telemetry-aqua" />
                  <span>3. Sub-Team Chat & Direct Messages</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  In <strong>Pit Wall</strong>, you have full realtime access to your sub-team's channel, read access to club announcements, and direct messaging with your teammates and Club Admins.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'head' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <Layers className="w-4 h-4 text-telemetry-blue" />
                  <span>1. Task Delegation & Creation</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  As Sub-Team Head, you have complete authority over deliverables in your group. Use <strong>"+ Create Task"</strong> to assign engineers, set deadlines, and specify technical acceptance criteria.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <CheckCircle2 className="w-4 h-4 text-[#8ED91E]" />
                  <span>2. Reviewing Work & Feedback Loops</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  When members submit work, the task moves to <code>Submitted</code>. Open the task, inspect the submission, and click <strong>"Approve Work"</strong> or <strong>"Request Changes"</strong> with written feedback.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <Users className="w-4 h-4 text-telemetry-pink" />
                  <span>3. Cross-Group "Pit Wall" Leadership Channel</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  You have exclusive access to the <strong>#pit-wall-heads</strong> channel to coordinate cross-team dependencies (e.g. Aerodynamics waiting for Vehicle Dynamics suspension geometry) and can direct message other Sub-team Heads.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <ShieldCheck className="w-4 h-4 text-telemetry-pink" />
                  <span>1. University Registration Approvals</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  Newly registered <code>@zewailcity.edu.eg</code> students enter a locked <code>pending</code> state with zero access to team data. In the <strong>Admin Hub</strong>, assign each student to one of the 5 sub-teams and designate them as Member or Head.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <Layers className="w-4 h-4 text-telemetry-blue" />
                  <span>2. Full Visibility & CSV/JSON Reports</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  You have full cross-group visibility across all 5 sub-teams. Use the <strong>"Export CSV"</strong> button in Tasks to download deliverable logs for Formula Student BOM cost tracking and advisor review.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-chrome-900 dark:text-white uppercase">
                  <Sparkles className="w-4 h-4 text-telemetry-amber" />
                  <span>3. Official Announcements</span>
                </div>
                <p className="text-chrome-900/80 dark:text-white/80">
                  You can post broadcast alerts in <strong>#announcements</strong>, which pushes notifications to all team members across all 5 sub-teams.
                </p>
              </div>
            </div>
          )}

          {/* RLS Security Footnote */}
          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 text-xs font-mono text-chrome-900/70 dark:text-white/60 space-y-1">
            <span className="font-bold text-telemetry-blue dark:text-telemetry-aqua flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Database-Level Row Level Security (RLS):
            </span>
            <p>
              All role permissions and sub-team isolation boundaries are strictly enforced by PostgreSQL RLS policies in the database engine, ensuring total data security at all times.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-chrome-300/40 dark:border-white/10 flex justify-end flex-shrink-0">
          <GhostButton size="sm" onClick={onClose}>
            Close Protocol Guide
          </GhostButton>
        </div>
      </GlassCard>
    </div>
  );
};
