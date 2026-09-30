import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  Users, 
  Clock,
  Plus,
  FolderPlus,
  UserMinus,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Profile, UserRole, Group } from '../../lib/database.types';

export const SUB_TEAMS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Technical - Vehicle Dynamics', slug: 'vehicle-dynamics', color_accent: '#2F6BFF', description: 'Suspension, chassis, brakes, tires, and kinematic simulation.', created_at: '' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Technical - Aerodynamics', slug: 'aerodynamics', color_accent: '#22E4F0', description: 'Wings, undertray, diffusers, CFD, and composite structures.', created_at: '' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Technical - Low-Voltage Electronics', slug: 'electronics', color_accent: '#FFC53D', description: 'Sensors, wiring harness, ECU, telemetry transmitters, and telemetry UI.', created_at: '' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Technical - Powertrain & Drivetrain', slug: 'powertrain', color_accent: '#FF4FA3', description: 'Engine/motor, differential, cooling, intake, exhaust, and battery management.', created_at: '' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Operations - Business, Cost & Marketing', slug: 'business-ops', color_accent: '#B6FF3B', description: 'Cost report, business presentation, sponsorship, branding, and logistics.', created_at: '' },
];

const PRESET_COLORS = [
  '#2F6BFF', // Electric Blue
  '#22E4F0', // Aqua
  '#FFC53D', // Amber
  '#FF4FA3', // Hot Pink
  '#B6FF3B', // Lime
  '#A855F7', // Purple
  '#F97316', // Orange
];

interface AdminApprovalHubProps {
  profiles: Profile[];
  groups?: Group[];
  onApproveUser: (userId: string, groupId: string, role: UserRole) => Promise<void>;
  onRejectUser: (userId: string) => Promise<void>;
  onCreateGroup?: (name: string, slug: string, description: string, colorAccent?: string) => Promise<Group | null>;
  onRemoveMember?: (userId: string) => Promise<void>;
}

export const AdminApprovalHub: React.FC<AdminApprovalHubProps> = ({
  profiles,
  groups,
  onApproveUser,
  onRejectUser,
  onCreateGroup,
  onRemoveMember,
}) => {
  const effectiveGroups = (groups && groups.length > 0) ? groups : (SUB_TEAMS as unknown as Group[]);

  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'teams' | 'members'>('approvals');
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Group creation modal state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSlug, setNewGroupSlug] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#2F6BFF');
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Member removal modal state
  const [memberToRemove, setMemberToRemove] = useState<Profile | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const pendingUsers = profiles.filter((p) => p.status === 'pending');
  const approvedUsers = profiles.filter((p) => p.status === 'approved' && p.role !== 'admin');

  const handleGroupSelect = (userId: string, groupId: string) => {
    setSelectedGroups((prev) => ({ ...prev, [userId]: groupId }));
  };

  const handleRoleSelect = (userId: string, role: UserRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleApprove = async (user: Profile) => {
    const groupId = selectedGroups[user.id] || effectiveGroups[0]?.id || SUB_TEAMS[0].id;
    const role = selectedRoles[user.id] || 'member';

    setProcessingId(user.id);
    try {
      await onApproveUser(user.id, groupId, role);
      const teamName = effectiveGroups.find(g => g.id === groupId)?.name || 'Sub-team';
      setSuccessMessage(`Approved ${user.full_name} as ${role.toUpperCase()} in ${teamName}`);
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

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateGroup) return;
    setCreateGroupError(null);

    const name = newGroupName.trim();
    const slug = (newGroupSlug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');

    if (!name) {
      setCreateGroupError('Sub-team name is required.');
      return;
    }
    if (!slug) {
      setCreateGroupError('Sub-team identifier/slug is required.');
      return;
    }

    setIsCreatingGroup(true);
    try {
      await onCreateGroup(name, slug, newGroupDesc, newGroupColor);
      setIsCreateGroupOpen(false);
      setNewGroupName('');
      setNewGroupSlug('');
      setNewGroupDesc('');
      setNewGroupColor('#2F6BFF');
      setSuccessMessage(`Sub-team "${name}" successfully registered into database.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setCreateGroupError(err instanceof Error ? err.message : 'Failed to create sub-team');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !onRemoveMember) return;
    setIsRemovingMember(true);
    setRemoveError(null);
    try {
      await onRemoveMember(memberToRemove.id);
      setSuccessMessage(`Removed ${memberToRemove.full_name} from sub-team. User status set to pending.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setMemberToRemove(null);
    } catch (err: unknown) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
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
              Access & Team Management
            </h2>
            <p className="text-xs font-sans text-chrome-900/60 dark:text-white/60">
              Review registrations, configure sub-teams, and govern membership rosters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 text-center">
              <div className="font-mono text-[10px] text-chrome-900/60 dark:text-white/50 uppercase">Pending Review</div>
              <div className="font-display font-black text-xl text-telemetry-amber">{pendingUsers.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 text-center">
              <div className="font-mono text-[10px] text-chrome-900/60 dark:text-white/50 uppercase">Sub-Teams</div>
              <div className="font-display font-black text-xl text-telemetry-aqua">{effectiveGroups.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 text-center">
              <div className="font-mono text-[10px] text-chrome-900/60 dark:text-white/50 uppercase">Active Engineers</div>
              <div className="font-display font-black text-xl text-telemetry-lime">{approvedUsers.length}</div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-chrome-300/60 dark:border-white/10">
          <button
            onClick={() => setActiveSubTab('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'approvals'
                ? 'bg-telemetry-blue text-white shadow-sm'
                : 'text-chrome-900/60 dark:text-white/60 hover:text-chrome-900 dark:hover:text-white'
            }`}
          >
            Pending Approvals ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('teams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'teams'
                ? 'bg-telemetry-blue text-white shadow-sm'
                : 'text-chrome-900/60 dark:text-white/60 hover:text-chrome-900 dark:hover:text-white'
            }`}
          >
            Sub-Teams ({effectiveGroups.length})
          </button>
          <button
            onClick={() => setActiveSubTab('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'members'
                ? 'bg-telemetry-blue text-white shadow-sm'
                : 'text-chrome-900/60 dark:text-white/60 hover:text-chrome-900 dark:hover:text-white'
            }`}
          >
            Club Engineers ({approvedUsers.length})
          </button>
        </div>
      </GlassCard>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-telemetry-lime/15 border border-telemetry-lime/30 text-telemetry-lime text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── TAB 1: PENDING APPROVALS ─── */}
      {activeSubTab === 'approvals' && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-chrome-300/60 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-telemetry-amber" />
              <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
                Registration Queue ({pendingUsers.length})
              </h3>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-chrome-900/50 dark:text-white/40">
              No pending registrations. All incoming university engineers have been approved.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {pendingUsers.map((user) => {
                const currentGroupChoice = selectedGroups[user.id] || effectiveGroups[0]?.id || SUB_TEAMS[0].id;
                const currentRoleChoice = selectedRoles[user.id] || 'member';

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ChromeAvatar name={user.full_name} size="md" />
                        <div>
                          <div className="font-bold text-sm text-chrome-900 dark:text-white">
                            {user.full_name}
                          </div>
                          <div className="font-mono text-xs text-chrome-900/60 dark:text-white/50">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <LedStatusChip status="todo" customLabel="PENDING REVIEW" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-chrome-900/70 dark:text-white/60 mb-1">
                          Assign Sub-Team
                        </label>
                        <select
                          value={currentGroupChoice}
                          onChange={(e) => handleGroupSelect(user.id, e.target.value)}
                          className="w-full h-10 px-3 rounded-lg text-xs font-sans bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/20 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
                        >
                          {effectiveGroups.map((team) => (
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

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-chrome-300/40 dark:border-white/5">
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
      )}

      {/* ─── TAB 2: SUB-TEAMS MANAGEMENT ─── */}
      {activeSubTab === 'teams' && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-chrome-300/60 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-telemetry-blue" />
              <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
                Official Sub-Teams ({effectiveGroups.length})
              </h3>
            </div>

            {onCreateGroup && (
              <GlossyButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsCreateGroupOpen(true)}
              >
                Create Sub-Team
              </GlossyButton>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {effectiveGroups.map((team) => {
              const memberCount = profiles.filter((p) => p.group_id === team.id && p.status === 'approved').length;
              const headCount = profiles.filter((p) => p.group_id === team.id && p.role === 'head' && p.status === 'approved').length;

              return (
                <div
                  key={team.id}
                  className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 flex flex-col justify-between gap-3"
                  style={{ borderLeftColor: team.color_accent || '#2F6BFF', borderLeftWidth: '4px' }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-chrome-900 dark:text-white truncate">
                        {team.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-black/5 dark:bg-white/10 text-chrome-900/70 dark:text-white/70">
                        {team.slug}
                      </span>
                    </div>

                    <p className="text-xs text-chrome-900/60 dark:text-white/60 line-clamp-2">
                      {team.description || 'Formula Student engineering sub-team.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-chrome-300/40 dark:border-white/5 text-chrome-900/60 dark:text-white/50">
                    <span>{memberCount} active engineers</span>
                    <span>{headCount > 0 ? `${headCount} Team Lead` : 'No Head assigned'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ─── TAB 3: ACTIVE CLUB ENGINEERS ROSTER ─── */}
      {activeSubTab === 'members' && (
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
              const team = effectiveGroups.find((t) => t.id === member.group_id);

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
                        {team ? team.name.replace('Technical - ', '').replace('Operations - ', '') : 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <LedStatusChip
                      status={member.role === 'head' ? 'in_progress' : 'done'}
                      customLabel={member.role.toUpperCase()}
                      size="sm"
                    />

                    {onRemoveMember && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="p-1.5 rounded-lg text-telemetry-red/70 hover:text-telemetry-red hover:bg-telemetry-red/10 border border-transparent hover:border-telemetry-red/30 transition-all cursor-pointer"
                        title="Remove member from sub-team"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ─── MODAL: CREATE NEW SUB-TEAM ─── */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-chrome-50 dark:bg-midnight-950 border border-telemetry-blue/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-chrome-300/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-telemetry-blue" />
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-chrome-900 dark:text-white">
                  Register Sub-Team
                </h3>
              </div>
              <button
                onClick={() => setIsCreateGroupOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-chrome-900/60 dark:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-chrome-900/70 dark:text-white/60 mb-1">
                  Sub-Team Official Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Technical - Aerodynamics & Cooling"
                  value={newGroupName}
                  onChange={(e) => {
                    setNewGroupName(e.target.value);
                    if (!newGroupSlug) {
                      setNewGroupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                    }
                  }}
                  className="w-full h-10 px-3 rounded-lg text-xs bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/20 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-chrome-900/70 dark:text-white/60 mb-1">
                  Identifier / Slug (Unique) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., aerodynamics-cooling"
                  value={newGroupSlug}
                  onChange={(e) => setNewGroupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full h-10 px-3 rounded-lg text-xs bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/20 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-chrome-900/70 dark:text-white/60 mb-1">
                  Mission & Scope Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe engineering scope, deliverables, and team responsibilities..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full p-3 rounded-lg text-xs bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/20 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-chrome-900/70 dark:text-white/60 mb-1.5">
                  Color Accent Indicator
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewGroupColor(color)}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: color,
                        borderColor: newGroupColor === color ? '#FFFFFF' : 'transparent',
                        boxShadow: newGroupColor === color ? `0 0 10px ${color}` : 'none'
                      }}
                    >
                      {newGroupColor === color && <Check className="w-3.5 h-3.5 text-black" />}
                    </button>
                  ))}
                </div>
              </div>

              {createGroupError && (
                <div className="p-3 rounded-lg bg-telemetry-red/10 border border-telemetry-red/30 text-telemetry-red text-xs font-mono">
                  {createGroupError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-chrome-300/40 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  disabled={isCreatingGroup}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold border border-chrome-300 dark:border-white/20 text-chrome-900/70 dark:text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <GlossyButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isCreatingGroup}
                  icon={<FolderPlus className="w-3.5 h-3.5" />}
                >
                  {isCreatingGroup ? 'Registering...' : 'Save Sub-Team'}
                </GlossyButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REMOVE MEMBER CONFIRMATION ─── */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-chrome-50 dark:bg-midnight-950 border border-telemetry-red/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-telemetry-red">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-chrome-900 dark:text-white">
                Remove from Sub-Team?
              </h3>
            </div>

            <p className="text-xs text-chrome-900/70 dark:text-white/70 leading-relaxed">
              Are you sure you want to remove <strong className="text-chrome-900 dark:text-white">{memberToRemove.full_name}</strong> from their sub-team?
              Their status will return to <span className="font-mono text-telemetry-amber font-bold">Pending</span>, quarantining their access to group channels and tasks. All historical deliverables, simulation files, and comments will remain safely preserved in the database audit log.
            </p>

            {removeError && (
              <div className="p-3 rounded-lg bg-telemetry-red/10 border border-telemetry-red/30 text-telemetry-red text-xs font-mono">
                {removeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setMemberToRemove(null); setRemoveError(null); }}
                disabled={isRemovingMember}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold border border-chrome-300 dark:border-white/20 text-chrome-900/70 dark:text-white/70 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={isRemovingMember}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-telemetry-red text-white hover:bg-telemetry-red/90 shadow-md shadow-telemetry-red/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>{isRemovingMember ? 'Removing...' : 'Confirm Removal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
