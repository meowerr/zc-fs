import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  Sparkles, 
  Users, 
  Clock
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Profile, UserRole } from '../../lib/database.types';

interface AdminApprovalHubProps {
  profiles: Profile[];
  onApproveUser: (userId: string, groupId: string, role: UserRole) => Promise<void>;
  onRejectUser: (userId: string) => Promise<void>;
}

export const SUB_TEAMS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Technical - Vehicle Dynamics', slug: 'vehicle-dynamics', color: '#2F6BFF' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Technical - Aerodynamics', slug: 'aerodynamics', color: '#22E4F0' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Technical - Low-Voltage Electronics', slug: 'electronics', color: '#FFC53D' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Technical - Powertrain & Drivetrain', slug: 'powertrain', color: '#FF4FA3' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Operations - Business, Cost & Marketing', slug: 'business-ops', color: '#B6FF3B' },
];

export const AdminApprovalHub: React.FC<AdminApprovalHubProps> = ({
  profiles,
  onApproveUser,
  onRejectUser,
}) => {
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pendingUsers = profiles.filter((p) => p.status === 'pending');
  const approvedUsers = profiles.filter((p) => p.status === 'approved' && p.role !== 'admin');

  const handleGroupSelect = (userId: string, groupId: string) => {
    setSelectedGroups((prev) => ({ ...prev, [userId]: groupId }));
  };

  const handleRoleSelect = (userId: string, role: UserRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleApprove = async (user: Profile) => {
    const groupId = selectedGroups[user.id] || SUB_TEAMS[0].id;
    const role = selectedRoles[user.id] || 'member';

    setProcessingId(user.id);
    try {
      await onApproveUser(user.id, groupId, role);
      setSuccessMessage(`Approved ${user.full_name} as ${role.toUpperCase()} in ${SUB_TEAMS.find(g => g.id === groupId)?.name}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      await onRejectUser(userId);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard variant="elevated" className="p-6 border-telemetry-blue/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-telemetry-blue/15 text-telemetry-blue font-mono text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CLUB ADMINISTRATION HQ</span>
            </div>
            <h2 className="font-display font-black text-2xl text-chrome-900 dark:text-white uppercase tracking-wider">
              Registration & Access Control
            </h2>
            <p className="text-xs font-sans text-chrome-900/60 dark:text-white/60">
              Review incoming university engineers, assign official sub-teams, and delegate leadership roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 text-center">
              <div className="font-mono text-[10px] text-chrome-900/60 dark:text-white/50 uppercase">Pending Review</div>
              <div className="font-display font-black text-xl text-telemetry-amber">{pendingUsers.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 text-center">
              <div className="font-mono text-[10px] text-chrome-900/60 dark:text-white/50 uppercase">Active Engineers</div>
              <div className="font-display font-black text-xl text-telemetry-lime">{approvedUsers.length}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#8ED91E]/15 border border-[#8ED91E]/40 text-[#4E8009] dark:text-[#B6FF3B] text-xs font-mono font-bold flex items-center gap-2 shadow-sm animate-bounce">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Section 1: Pending Registrations Queue */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-chrome-300/60 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-telemetry-amber" />
            <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
              Pending Approvals Queue ({pendingUsers.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-chrome-900/50 dark:text-white/40">
            @zewailcity.edu.eg verified
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#8ED91E]/15 border border-[#8ED91E]/30 flex items-center justify-center text-[#8ED91E]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-sm text-chrome-900 dark:text-white">
              Queue Clear
            </h4>
            <p className="text-xs text-chrome-900/60 dark:text-white/50 max-w-sm mx-auto">
              No pending registrations awaiting approval. All university engineers have been assigned.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => {
              const currentGroupChoice = selectedGroups[user.id] || SUB_TEAMS[0].id;
              const currentRoleChoice = selectedRoles[user.id] || 'member';

              return (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-chrome-300/80 dark:border-white/10 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ChromeAvatar name={user.full_name} role="pending" size="md" />
                      <div>
                        <div className="font-bold text-sm text-chrome-900 dark:text-white flex items-center gap-2">
                          <span>{user.full_name}</span>
                          <LedStatusChip status="pending" size="sm" />
                        </div>
                        <div className="font-mono text-xs text-telemetry-blue dark:text-telemetry-aqua">
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-[11px] text-chrome-900/50 dark:text-white/40">
                            Phone: {user.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-chrome-900/50 dark:text-white/40">
                      Applied {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Assignment Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-chrome-300/40 dark:border-white/5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-chrome-900/70 dark:text-white/60 mb-1">
                        Assign Sub-Team
                      </label>
                      <select
                        value={currentGroupChoice}
                        onChange={(e) => handleGroupSelect(user.id, e.target.value)}
                        className="w-full h-10 px-3 rounded-lg text-xs font-sans bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/20 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
                      >
                        {SUB_TEAMS.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-chrome-900/70 dark:text-white/60 mb-1">
                        Assign Role
                      </label>
                      <select
                        value={currentRoleChoice}
                        onChange={(e) => handleRoleSelect(user.id, e.target.value as UserRole)}
                        className="w-full h-10 px-3 rounded-lg text-xs font-sans bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/20 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
                      >
                        <option value="member">Member (Engineer)</option>
                        <option value="head">Group Head (Sub-team Lead)</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <GhostButton
                      size="sm"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      disabled={processingId === user.id}
                      onClick={() => handleReject(user.id)}
                    >
                      Reject
                    </GhostButton>

                    <GlossyButton
                      variant="success"
                      size="sm"
                      icon={<UserCheck className="w-3.5 h-3.5" />}
                      disabled={processingId === user.id}
                      onClick={() => handleApprove(user)}
                    >
                      {processingId === user.id ? 'Processing...' : 'Approve & Activate'}
                    </GlossyButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Section 2: Active Team Roster */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-chrome-300/60 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-telemetry-blue" />
            <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
              Active Club Engineers ({approvedUsers.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {approvedUsers.map((member) => {
            const team = SUB_TEAMS.find((t) => t.id === member.group_id);

            return (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ChromeAvatar name={member.full_name} role={member.role} size="sm" />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-chrome-900 dark:text-white truncate">
                      {member.full_name}
                    </div>
                    <div className="font-mono text-[10px] text-chrome-900/50 dark:text-white/40 truncate">
                      {team ? team.name.replace('Technical - ', '') : 'General'}
                    </div>
                  </div>
                </div>

                <LedStatusChip
                  status={member.role === 'head' ? 'in_progress' : 'done'}
                  customLabel={member.role.toUpperCase()}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
