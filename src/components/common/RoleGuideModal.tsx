import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  Layers, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { ModalShell } from './ModalShell';
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

  const modalFooter = (
    <div className="flex justify-end">
      <GhostButton size="sm" onClick={onClose}>
        Close Guide
      </GhostButton>
    </div>
  );

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title="Engineering Protocol Guide"
      footer={modalFooter}
      maxWidth="md:max-w-2xl"
    >
      <div className="space-y-4">
        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-cyber-bg-alt border border-cyber-border">
          {(['member', 'head', 'admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`flex-1 min-h-[40px] py-2 px-3 rounded-lg text-label font-mono font-medium uppercase transition-all cursor-pointer ${
                selectedRole === r
                  ? 'bg-accent-cyan text-black font-bold shadow-sm'
                  : 'text-cyber-secondary hover:text-cyber-primary'
              }`}
            >
              {r === 'admin' ? 'Club Admin' : r === 'head' ? 'Group Head' : 'Member (Engineer)'}
            </button>
          ))}
        </div>

        {/* Role Guide Content */}
        <div className="space-y-4 text-xs sm:text-sm font-sans leading-relaxed">
          {selectedRole === 'member' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <Layers className="w-4 h-4 text-accent-cyan" />
                  <span>1. Working on Sub-Team Deliverables</span>
                </div>
                <p className="text-cyber-secondary">
                  You belong to exactly one official sub-team (e.g., Vehicle Dynamics). In the <strong className="text-cyber-primary">Tasks</strong> tab, you can view your assigned tasks, review CAD/code references, and update status from <code className="text-accent-yellow">To Do</code> to <code className="text-accent-cyan">In Progress</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <CheckCircle2 className="w-4 h-4 text-accent-lime" />
                  <span>2. Submitting Deliverables & Multi-Version History</span>
                </div>
                <p className="text-cyber-secondary">
                  Click on any assigned task and select <strong className="text-cyber-primary">"Submit Work Deliverable"</strong>. You can attach GitHub PRs, Onshape CAD links, or upload files up to 25 MB. Every resubmission creates a new version (<code className="text-accent-cyan">v1</code>, <code className="text-accent-cyan">v2</code>) preserving feedback history.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>3. Communication Scope</span>
                </div>
                <p className="text-cyber-secondary">
                  You have access to your own sub-team's chat channel, the team-wide announcements channel, and can direct-message teammates within your sub-team or reach out to Club Admins.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'head' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <Sparkles className="w-4 h-4 text-accent-cyan" />
                  <span>1. Sub-Team Leadership & Task Assignment</span>
                </div>
                <p className="text-cyber-secondary">
                  As a Group Head, you can create tasks for your sub-team, assign engineers, set deadlines, and manage telemetry benchmarks. You cannot modify tasks belonging to other engineering groups.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <CheckCircle2 className="w-4 h-4 text-accent-lime" />
                  <span>2. Reviewing Work & Approval Gates</span>
                </div>
                <p className="text-cyber-secondary">
                  When engineers submit deliverables, they move to <code className="text-purple-400">In Review</code>. You can review submitted CAD models or documents, provide feedback notes, and mark them as <strong className="text-accent-lime">Approved</strong> or <strong className="text-accent-red">Changes Requested</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <Users className="w-4 h-4 text-brand-orange" />
                  <span>3. Cross-Team Leadership Channel</span>
                </div>
                <p className="text-cyber-secondary">
                  You participate in the exclusive <code className="text-accent-cyan">#heads-only</code> channel to coordinate inter-disciplinary work with other sub-team leads and club leadership.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'admin' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <ShieldCheck className="w-4 h-4 text-accent-cyan" />
                  <span>1. Member Registration & Division Assignment</span>
                </div>
                <p className="text-cyber-secondary">
                  Club Admins oversee registrations in the <strong className="text-cyber-primary">Admin Hub</strong>. Newly registered accounts start in <code className="text-accent-yellow">Pending</code> status with zero data access until approved and assigned to a sub-team division.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-cyber-primary uppercase">
                  <Layers className="w-4 h-4 text-accent-lime" />
                  <span>2. Full Telemetry Oversight & Sub-Team Management</span>
                </div>
                <p className="text-cyber-secondary">
                  Admins can view all 5 sub-teams, manage sub-team definitions, create tasks across any group, export full telemetry data to CSV/JSON, and run diagnostic health pings.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
