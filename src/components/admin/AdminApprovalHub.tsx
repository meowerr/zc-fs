import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  Users, 
  Clock,
  Plus,
  FolderPlus,
  UserMinus,
  AlertTriangle,
  Check,
  X,
  Search,
  ArrowRightLeft,
  Eye,
  Activity,
  Database,
  Shield,
  HardDrive,
  RefreshCw,
  Server
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Profile, UserRole, UserStatus, Group } from '../../lib/database.types';
import { SUB_TEAMS, PRESET_COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

export { SUB_TEAMS, PRESET_COLORS };

interface AdminApprovalHubProps {
  currentUser?: Profile | null;
  profiles: Profile[];
  groups?: Group[];
  onApproveUser: (userId: string, groupId: string, role: UserRole) => Promise<void>;
  onRejectUser: (userId: string) => Promise<void>;
  onCreateGroup?: (name: string, slug: string, description: string, colorAccent?: string) => Promise<Group | null>;
  onRemoveMember?: (userId: string) => Promise<void>;
  onReassignMember?: (userId: string, targetGroupId: string | null, targetRole: UserRole) => Promise<void>;
  onUpdateUserStatus?: (userId: string, newStatus: UserStatus) => Promise<void>;
}

interface ServiceHealth {
  status: 'checking' | 'operational' | 'degraded' | 'offline';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export const AdminApprovalHub: React.FC<AdminApprovalHubProps> = ({
  currentUser,
  profiles,
  groups,
  onApproveUser,
  onRejectUser,
  onCreateGroup,
  onRemoveMember,
  onReassignMember,
  onUpdateUserStatus,
}) => {
  const effectiveGroups = (groups && groups.length > 0) ? groups : (SUB_TEAMS as unknown as Group[]);

  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'people' | 'teams' | 'health'>('approvals');
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // People Management Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Inspection Modal State
  const [inspectedMember, setInspectedMember] = useState<Profile | null>(null);

  // Transfer / Reassign Modal State
  const [reassignMemberTarget, setReassignMemberTarget] = useState<Profile | null>(null);
  const [transferGroupId, setTransferGroupId] = useState<string>('');
  const [transferRole, setTransferRole] = useState<UserRole>('member');
  const [isTransferring, setIsTransferring] = useState(false);

  // Group creation modal state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSlug, setNewGroupSlug] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#2F6BFF');
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Member unassign / removal modal state
  const [memberToRemove, setMemberToRemove] = useState<Profile | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // System Health States
  const [healthLoading, setHealthLoading] = useState(false);
  const [dbHealth, setDbHealth] = useState<ServiceHealth>({ status: 'checking' });
  const [authHealth, setAuthHealth] = useState<ServiceHealth>({ status: 'checking' });
  const [storageHealth, setStorageHealth] = useState<ServiceHealth>({ status: 'checking' });
  const [realtimeHealth, setRealtimeHealth] = useState<ServiceHealth>({ status: 'checking' });
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);

  const pendingUsers = profiles.filter((p) => p.status === 'pending');
  const approvedUsers = profiles.filter((p) => p.status === 'approved' && p.role !== 'admin');

  // Helper for group lookup
  const getGroupMeta = (groupId: string | null) => {
    if (!groupId) return null;
    return effectiveGroups.find((g) => g.id === groupId);
  };

  // Filtered people for People Management tab
  const filteredPeople = useMemo(() => {
    return profiles.filter((p) => {
      // Team filter
      if (teamFilter !== 'all') {
        if (teamFilter === 'unassigned') {
          if (p.group_id !== null) return false;
        } else {
          if (p.group_id !== teamFilter) return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all' && p.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.full_name?.toLowerCase().includes(q);
        const matchesEmail = p.email?.toLowerCase().includes(q);
        const group = getGroupMeta(p.group_id);
        const matchesGroup = group?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesGroup) {
          return false;
        }
      }

      return true;
    });
  }, [profiles, teamFilter, roleFilter, statusFilter, searchQuery, effectiveGroups]);

  // System Diagnostics Check
  const runSystemDiagnostics = async () => {
    setHealthLoading(true);
    setDbHealth({ status: 'checking' });
    setAuthHealth({ status: 'checking' });
    setStorageHealth({ status: 'checking' });
    setRealtimeHealth({ status: 'checking' });

    // 1. Database Ping
    try {
      const start = performance.now();
      const { data: pingData, error: pingErr } = await supabase.rpc('system_health_check');
      const latency = Math.round(performance.now() - start);

      if (!pingErr && pingData) {
        setDbHealth({
          status: 'operational',
          latencyMs: latency,
          message: 'PostgreSQL 15 connected via RPC',
          details: pingData.metrics
        });
      } else {
        // Fallback query if RPC isn't loaded yet
        const fbStart = performance.now();
        const { error: countErr, count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        const fbLatency = Math.round(performance.now() - fbStart);

        if (countErr) {
          setDbHealth({ status: 'degraded', latencyMs: fbLatency, message: countErr.message });
        } else {
          setDbHealth({
            status: 'operational',
            latencyMs: fbLatency,
            message: `Operational (REST table count: ${count} profiles)`
          });
        }
      }
    } catch (e: any) {
      setDbHealth({ status: 'offline', message: e.message || 'Database unreachable' });
    }

    // 2. Auth Session Check
    try {
      const authStart = performance.now();
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      const authLatency = Math.round(performance.now() - authStart);

      if (sessionErr || !sessionData.session) {
        setAuthHealth({ status: 'degraded', latencyMs: authLatency, message: 'No active session token' });
      } else {
        setAuthHealth({
          status: 'operational',
          latencyMs: authLatency,
          message: `Active (User: ${sessionData.session.user.email})`
        });
      }
    } catch (e: any) {
      setAuthHealth({ status: 'offline', message: e.message || 'Auth service unreachable' });
    }

    // 3. Storage Check
    try {
      const storageStart = performance.now();
      const { error: bucketErr } = await supabase.storage.getBucket('task-attachments');
      const storageLatency = Math.round(performance.now() - storageStart);

      if (bucketErr) {
        setStorageHealth({ status: 'degraded', latencyMs: storageLatency, message: bucketErr.message });
      } else {
        setStorageHealth({
          status: 'operational',
          latencyMs: storageLatency,
          message: `Bucket "task-attachments" active (Quota: 25 MB)`
        });
      }
    } catch (e: any) {
      setStorageHealth({ status: 'offline', message: e.message || 'Storage unreachable' });
    }

    // 4. Realtime CDC Check
    try {
      const rtStart = performance.now();
      const testChannel = supabase.channel(`health_ping_${Date.now()}`);
      testChannel.subscribe((status) => {
        const rtLatency = Math.round(performance.now() - rtStart);
        if (status === 'SUBSCRIBED') {
          setRealtimeHealth({
            status: 'operational',
            latencyMs: rtLatency,
            message: 'Websocket CDC subscription active'
          });
          supabase.removeChannel(testChannel);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeHealth({
            status: 'degraded',
            latencyMs: rtLatency,
            message: `Status: ${status}`
          });
          supabase.removeChannel(testChannel);
        }
      });
    } catch (e: any) {
      setRealtimeHealth({ status: 'offline', message: e.message || 'Realtime engine error' });
    }

    setLastHealthCheck(new Date());
    setHealthLoading(false);
  };

  useEffect(() => {
    if (activeSubTab === 'health' && !lastHealthCheck) {
      runSystemDiagnostics();
    }
  }, [activeSubTab]);

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
    setErrorMessage(null);
    try {
      await onApproveUser(user.id, groupId, role);
      const teamName = effectiveGroups.find(g => g.id === groupId)?.name || 'Sub-team';
      setSuccessMessage(`Approved ${user.full_name} as ${role.toUpperCase()} in ${teamName}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to approve user');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    setErrorMessage(null);
    try {
      await onRejectUser(userId);
      setSuccessMessage('Registration rejected.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject user');
      setTimeout(() => setErrorMessage(null), 5000);
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

  const openReassignModal = (member: Profile) => {
    setReassignMemberTarget(member);
    setTransferGroupId(member.group_id || effectiveGroups[0]?.id || '');
    setTransferRole(member.role === 'head' ? 'head' : 'member');
  };

  const handleExecuteReassign = async () => {
    if (!reassignMemberTarget || !onReassignMember) return;
    setIsTransferring(true);
    setErrorMessage(null);
    try {
      await onReassignMember(reassignMemberTarget.id, transferGroupId, transferRole);
      const team = effectiveGroups.find(g => g.id === transferGroupId);
      setSuccessMessage(`Transferred ${reassignMemberTarget.full_name} to ${team?.name || 'Sub-team'} as ${transferRole.toUpperCase()}`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setReassignMemberTarget(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reassign member');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleConfirmUnassignMember = async () => {
    if (!memberToRemove || !onRemoveMember) return;
    setIsRemovingMember(true);
    setErrorMessage(null);
    try {
      await onRemoveMember(memberToRemove.id);
      setSuccessMessage(`Unassigned ${memberToRemove.full_name} from sub-team. Account status preserved as approved.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setMemberToRemove(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to unassign member');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleToggleStatus = async (user: Profile, newStatus: UserStatus) => {
    if (!onUpdateUserStatus) return;
    try {
      await onUpdateUserStatus(user.id, newStatus);
      setSuccessMessage(`Updated ${user.full_name} status to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard variant="elevated" className="p-5 sm:p-6 border-cyber-border-strong">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-cyber-bg-alt border border-cyber-border text-xs font-mono">
              <span className="text-accent-cyan font-bold">//</span>
              <span className="text-cyber-secondary uppercase tracking-widest text-[11px]">ADMIN COMMAND HQ</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-cyber-primary uppercase tracking-wider">
              Club Administration & Personnel
            </h2>
            <p className="text-xs font-sans text-cyber-secondary">
              Review registrations, govern member assignments, inspect telemetry health, and orchestrate sub-teams.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2.5 sm:p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border text-center min-w-[70px]">
              <div className="font-mono text-[9px] text-cyber-muted uppercase">Pending</div>
              <div className="font-display font-black text-lg sm:text-xl text-accent-yellow">{pendingUsers.length}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border text-center min-w-[70px]">
              <div className="font-mono text-[9px] text-cyber-muted uppercase">Sub-Teams</div>
              <div className="font-display font-black text-lg sm:text-xl text-accent-cyan">{effectiveGroups.length}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border text-center min-w-[70px]">
              <div className="font-mono text-[9px] text-cyber-muted uppercase">Engineers</div>
              <div className="font-display font-black text-lg sm:text-xl text-accent-lime">{approvedUsers.length}</div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1.5 mt-5 pt-3.5 border-t border-cyber-border overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSubTab('approvals')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer border whitespace-nowrap ${
              activeSubTab === 'approvals'
                ? 'bg-accent-cyan text-black border-accent-cyan shadow-sm font-bold'
                : 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border hover:text-cyber-primary'
            }`}
          >
            Pending Approvals ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('people')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer border whitespace-nowrap ${
              activeSubTab === 'people'
                ? 'bg-accent-cyan text-black border-accent-cyan shadow-sm font-bold'
                : 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border hover:text-cyber-primary'
            }`}
          >
            People Management ({profiles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('teams')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer border whitespace-nowrap ${
              activeSubTab === 'teams'
                ? 'bg-accent-cyan text-black border-accent-cyan shadow-sm font-bold'
                : 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border hover:text-cyber-primary'
            }`}
          >
            Sub-Teams ({effectiveGroups.length})
          </button>
          <button
            onClick={() => setActiveSubTab('health')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer border whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'health'
                ? 'bg-accent-cyan text-black border-accent-cyan shadow-sm font-bold'
                : 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border hover:text-cyber-primary'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>System Health</span>
          </button>
        </div>
      </GlassCard>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── TAB 1: PENDING APPROVALS ─── */}
      {activeSubTab === 'approvals' && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-yellow" />
              <h3 className="font-display font-bold text-base text-cyber-primary uppercase tracking-wider">
                Registration Queue ({pendingUsers.length})
              </h3>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-cyber-muted">
              No pending registrations. All incoming university engineers have been approved.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <ChromeAvatar name={user.full_name} role={user.role} size="md" />
                    <div>
                      <div className="font-bold text-sm text-cyber-primary">{user.full_name}</div>
                      <div className="font-mono text-xs text-cyber-secondary">{user.email}</div>
                      <div className="font-mono text-[10px] text-cyber-muted mt-0.5">
                        Applied: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Sub-Team Dropdown */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-mono uppercase text-cyber-muted mb-0.5">Assign Sub-Team</label>
                      <select
                        aria-label="Assign Sub-Team"
                        value={selectedGroups[user.id] || effectiveGroups[0]?.id || ''}
                        onChange={(e) => handleGroupSelect(user.id, e.target.value)}
                        className="h-8 px-2.5 rounded bg-cyber-bg-alt border border-cyber-border text-xs text-cyber-primary font-sans focus:outline-none focus:border-accent-cyan"
                      >
                        {effectiveGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name.replace('Technical - ', '').replace('Operations - ', '')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Role Dropdown */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-mono uppercase text-cyber-muted mb-0.5">Assign Role</label>
                      <select
                        aria-label="Assign Role"
                        value={selectedRoles[user.id] || 'member'}
                        onChange={(e) => handleRoleSelect(user.id, e.target.value as UserRole)}
                        className="h-8 px-2.5 rounded bg-cyber-bg-alt border border-cyber-border text-xs text-cyber-primary font-sans focus:outline-none focus:border-accent-cyan"
                      >
                        <option value="member">Member</option>
                        <option value="head">Group Head</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3.5">
                      <GlossyButton
                        variant="action"
                        size="sm"
                        onClick={() => handleApprove(user)}
                        disabled={processingId === user.id}
                        className="h-8 px-3"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </GlossyButton>

                      <GlossyButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(user.id)}
                        disabled={processingId === user.id}
                        className="h-8 px-3"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </GlossyButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* ─── TAB 2: COMPREHENSIVE PEOPLE MANAGEMENT ─── */}
      {activeSubTab === 'people' && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent-cyan" />
              <h3 className="font-display font-bold text-base text-cyber-primary uppercase tracking-wider">
                Club Personnel Directory ({filteredPeople.length})
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
              <input
                type="text"
                placeholder="Search name, email, group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs bg-cyber-surface border border-cyber-border rounded-lg text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan font-sans"
              />
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            {/* Filter by Sub-Team */}
            <div>
              <label className="block text-[10px] uppercase text-cyber-muted mb-1">Sub-Team</label>
              <select
                aria-label="Filter by Sub-Team"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full h-8 px-2 rounded bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                <option value="all">All Sub-Teams</option>
                <option value="unassigned">Unassigned Only</option>
                {effectiveGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name.replace('Technical - ', '').replace('Operations - ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Role */}
            <div>
              <label className="block text-[10px] uppercase text-cyber-muted mb-1">Role</label>
              <select
                aria-label="Filter by Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-8 px-2 rounded bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                <option value="all">All Roles</option>
                <option value="admin">Club Admin</option>
                <option value="head">Group Head</option>
                <option value="member">Member</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-[10px] uppercase text-cyber-muted mb-1">Status</label>
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-8 px-2 rounded bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected / Suspended</option>
              </select>
            </div>
          </div>

          {/* Personnel Table / Roster */}
          <div className="space-y-2 pt-2">
            {filteredPeople.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-cyber-muted">
                No personnel found matching the specified filters.
              </div>
            ) : (
              filteredPeople.map((member) => {
                const team = getGroupMeta(member.group_id);
                const isSelf = currentUser?.id === member.id;

                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-cyber-surface-elevated border border-cyber-border hover:border-cyber-border-strong transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ChromeAvatar name={member.full_name} role={member.role} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-cyber-primary truncate">{member.full_name}</span>
                          {isSelf && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-cyber-secondary truncate">{member.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: team?.color_accent || '#737D89' }}
                          />
                          <span className="font-mono text-[10px] text-cyber-muted truncate">
                            {team ? team.name.replace('Technical - ', '').replace('Operations - ', '') : 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {/* Role Chip */}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                        member.role === 'admin'
                          ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan font-bold'
                          : member.role === 'head'
                          ? 'bg-accent-orange/10 border-accent-orange/30 text-accent-orange font-bold'
                          : 'bg-cyber-surface border-cyber-border text-cyber-secondary'
                      }`}>
                        {member.role}
                      </span>

                      {/* Status Chip */}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                        member.status === 'approved'
                          ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime'
                          : member.status === 'pending'
                          ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                          : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
                      }`}>
                        {member.status}
                      </span>

                      {/* Action: Inspect */}
                      <button
                        onClick={() => setInspectedMember(member)}
                        className="p-1.5 rounded-lg text-cyber-secondary hover:text-accent-cyan hover:bg-cyber-surface border border-cyber-border hover:border-accent-cyan/40 transition-all cursor-pointer"
                        title="Inspect Profile Telemetry"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Action: Transfer / Reassign (not self if admin) */}
                      {!isSelf && (
                        <button
                          onClick={() => openReassignModal(member)}
                          className="p-1.5 rounded-lg text-cyber-secondary hover:text-accent-orange hover:bg-cyber-surface border border-cyber-border hover:border-accent-orange/40 transition-all cursor-pointer"
                          title="Transfer Sub-Team or Change Role"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                      )}

                      {/* Action: Unassign from group */}
                      {!isSelf && member.group_id && (
                        <button
                          onClick={() => setMemberToRemove(member)}
                          className="p-1.5 rounded-lg text-cyber-secondary hover:text-accent-red hover:bg-accent-red/10 border border-cyber-border hover:border-accent-red/30 transition-all cursor-pointer"
                          title="Unassign from Sub-Team"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      )}

      {/* ─── TAB 3: SUB-TEAMS MANAGEMENT ─── */}
      {activeSubTab === 'teams' && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-accent-cyan" />
              <h3 className="font-display font-bold text-base text-cyber-primary uppercase tracking-wider">
                Official Sub-Teams ({effectiveGroups.length})
              </h3>
            </div>

            {onCreateGroup && (
              <GlossyButton
                variant="primary"
                size="sm"
                onClick={() => setIsCreateGroupOpen(true)}
                className="h-8 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Sub-Team
              </GlossyButton>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {effectiveGroups.map((group) => {
              const teamMembers = profiles.filter((p) => p.group_id === group.id && p.status === 'approved');
              const headCount = teamMembers.filter((m) => m.role === 'head').length;

              return (
                <div
                  key={group.id}
                  className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border hover:border-cyber-border-strong transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color_accent || '#2F6BFF' }}
                      />
                      <span className="font-bold text-sm text-cyber-primary">{group.name}</span>
                    </div>
                    <span className="font-mono text-xs text-cyber-muted">
                      {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  {group.description && (
                    <p className="text-xs text-cyber-secondary font-sans line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-cyber-border flex items-center justify-between text-[11px] font-mono text-cyber-muted">
                    <span>Slug: #{group.slug}</span>
                    <span className="text-cyber-secondary">{headCount > 0 ? `${headCount} Team Lead` : 'No Head assigned'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ─── TAB 4: SYSTEM HEALTH & DIAGNOSTICS (Objective 22) ─── */}
      {activeSubTab === 'health' && (
        <GlassCard className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-accent-cyan" />
              <div>
                <h3 className="font-display font-bold text-base text-cyber-primary uppercase tracking-wider">
                  Platform Telemetry & Infrastructure Health
                </h3>
                <p className="text-[11px] font-mono text-cyber-muted">
                  Live verification of Supabase PostgreSQL, GoTrue Auth, Storage, and Realtime CDC.
                </p>
              </div>
            </div>

            <GlossyButton
              variant="outline"
              size="sm"
              onClick={runSystemDiagnostics}
              disabled={healthLoading}
              className="h-8 px-3 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${healthLoading ? 'animate-spin' : ''}`} />
              Run Health Ping
            </GlossyButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Database Health Card */}
            <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyber-primary font-bold text-xs uppercase font-mono">
                  <Database className="w-4 h-4 text-accent-cyan" />
                  <span>PostgreSQL DB</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  dbHealth.status === 'operational'
                    ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime'
                    : dbHealth.status === 'checking'
                    ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                    : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
                }`}>
                  {dbHealth.status}
                </span>
              </div>
              <div className="font-mono text-xl font-black text-cyber-primary">
                {dbHealth.latencyMs !== undefined ? `${dbHealth.latencyMs} ms` : '--'}
              </div>
              <p className="text-[10px] font-mono text-cyber-muted truncate">
                {dbHealth.message || 'Testing connection...'}
              </p>
            </div>

            {/* Auth Service Card */}
            <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyber-primary font-bold text-xs uppercase font-mono">
                  <Shield className="w-4 h-4 text-accent-lime" />
                  <span>GoTrue Auth</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  authHealth.status === 'operational'
                    ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime'
                    : authHealth.status === 'checking'
                    ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                    : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
                }`}>
                  {authHealth.status}
                </span>
              </div>
              <div className="font-mono text-xl font-black text-cyber-primary">
                {authHealth.latencyMs !== undefined ? `${authHealth.latencyMs} ms` : '--'}
              </div>
              <p className="text-[10px] font-mono text-cyber-muted truncate">
                {authHealth.message || 'Verifying JWT session...'}
              </p>
            </div>

            {/* Storage Card */}
            <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyber-primary font-bold text-xs uppercase font-mono">
                  <HardDrive className="w-4 h-4 text-accent-orange" />
                  <span>Storage Buckets</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  storageHealth.status === 'operational'
                    ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime'
                    : storageHealth.status === 'checking'
                    ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                    : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
                }`}>
                  {storageHealth.status}
                </span>
              </div>
              <div className="font-mono text-xl font-black text-cyber-primary">
                {storageHealth.latencyMs !== undefined ? `${storageHealth.latencyMs} ms` : '--'}
              </div>
              <p className="text-[10px] font-mono text-cyber-muted truncate">
                {storageHealth.message || 'Checking task-attachments...'}
              </p>
            </div>

            {/* Realtime Engine Card */}
            <div className="p-4 rounded-xl bg-cyber-surface-elevated border border-cyber-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyber-primary font-bold text-xs uppercase font-mono">
                  <Activity className="w-4 h-4 text-accent-yellow" />
                  <span>Realtime CDC</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  realtimeHealth.status === 'operational'
                    ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime'
                    : realtimeHealth.status === 'checking'
                    ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                    : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
                }`}>
                  {realtimeHealth.status}
                </span>
              </div>
              <div className="font-mono text-xl font-black text-cyber-primary">
                {realtimeHealth.latencyMs !== undefined ? `${realtimeHealth.latencyMs} ms` : '--'}
              </div>
              <p className="text-[10px] font-mono text-cyber-muted truncate">
                {realtimeHealth.message || 'Connecting websocket...'}
              </p>
            </div>
          </div>

          {lastHealthCheck && (
            <div className="text-[10px] font-mono text-cyber-muted text-right">
              Telemetry ping timestamp: {lastHealthCheck.toLocaleTimeString()} (UTC {lastHealthCheck.toISOString()})
            </div>
          )}
        </GlassCard>
      )}

      {/* ─── MODAL: INSPECT PROFILE ─── */}
      {inspectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-accent-cyan" />
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-cyber-primary">
                  Engineer Telemetry Profile
                </h3>
              </div>
              <button
                onClick={() => setInspectedMember(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-cyber-surface text-cyber-muted hover:text-cyber-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-cyber-bg-alt border border-cyber-border">
              <ChromeAvatar name={inspectedMember.full_name} role={inspectedMember.role} size="lg" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-cyber-primary">{inspectedMember.full_name}</div>
                <div className="font-mono text-xs text-cyber-secondary truncate">{inspectedMember.email}</div>
                <div className="font-mono text-[10px] text-cyber-muted mt-0.5">
                  ID: <span className="select-all">{inspectedMember.id}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-cyber-surface border border-cyber-border">
                <span className="text-cyber-muted uppercase">Sub-Team</span>
                <span className="text-cyber-primary font-bold">
                  {getGroupMeta(inspectedMember.group_id)?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-cyber-surface border border-cyber-border">
                <span className="text-cyber-muted uppercase">Role Assignment</span>
                <span className="text-cyber-primary font-bold uppercase">{inspectedMember.role}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-cyber-surface border border-cyber-border">
                <span className="text-cyber-muted uppercase">Account Status</span>
                <span className="text-cyber-primary font-bold uppercase">{inspectedMember.status}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-cyber-surface border border-cyber-border">
                <span className="text-cyber-muted uppercase">Registered At</span>
                <span className="text-cyber-primary">{new Date(inspectedMember.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Quick Status Toggles for Admin */}
            {currentUser?.id !== inspectedMember.id && onUpdateUserStatus && (
              <div className="pt-2 border-t border-cyber-border space-y-2">
                <span className="text-[10px] font-mono uppercase text-cyber-muted block">Status Management</span>
                <div className="flex items-center gap-2">
                  {inspectedMember.status !== 'approved' && (
                    <GlossyButton
                      variant="action"
                      size="sm"
                      onClick={() => handleToggleStatus(inspectedMember, 'approved')}
                      className="text-xs h-7 flex-1"
                    >
                      Approve Account
                    </GlossyButton>
                  )}
                  {inspectedMember.status !== 'rejected' && (
                    <GlossyButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleToggleStatus(inspectedMember, 'rejected')}
                      className="text-xs h-7 flex-1"
                    >
                      Suspend / Reject
                    </GlossyButton>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <GhostButton size="sm" onClick={() => setInspectedMember(null)}>
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REASSIGN SUB-TEAM / ROLE ─── */}
      {reassignMemberTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-accent-orange" />
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-cyber-primary">
                  Transfer Member
                </h3>
              </div>
              <button
                onClick={() => setReassignMemberTarget(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-cyber-surface text-cyber-muted hover:text-cyber-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-sans text-cyber-secondary">
              Transfer <strong className="text-cyber-primary">{reassignMemberTarget.full_name}</strong> to a different sub-team or promote/demote role.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-cyber-muted mb-1">Target Sub-Team *</label>
                <select
                  value={transferGroupId}
                  onChange={(e) => setTransferGroupId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                >
                  {effectiveGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-cyber-muted mb-1">Target Role *</label>
                <select
                  value={transferRole}
                  onChange={(e) => setTransferRole(e.target.value as UserRole)}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                >
                  <option value="member">Member (Regular Engineer)</option>
                  <option value="head">Group Head (Sub-Team Lead)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyber-border">
              <GhostButton size="sm" onClick={() => setReassignMemberTarget(null)}>
                Cancel
              </GhostButton>
              <GlossyButton
                variant="primary"
                size="sm"
                onClick={handleExecuteReassign}
                disabled={isTransferring}
              >
                {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
              </GlossyButton>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: UNASSIGN CONFIRMATION ─── */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-accent-yellow">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-cyber-primary">
                Unassign Member
              </h3>
            </div>

            <p className="text-xs font-sans text-cyber-secondary">
              Are you sure you want to unassign <strong className="text-cyber-primary">{memberToRemove.full_name}</strong> from their sub-team?
            </p>
            <p className="text-[11px] font-mono text-cyber-muted bg-cyber-bg-alt p-2.5 rounded border border-cyber-border">
              Their university account will remain <strong>APPROVED</strong>, but they will be moved to the unassigned member pool until reassigned to another team.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyber-border">
              <GhostButton size="sm" onClick={() => setMemberToRemove(null)}>
                Cancel
              </GhostButton>
              <GlossyButton
                variant="warning"
                size="sm"
                onClick={handleConfirmUnassignMember}
                disabled={isRemovingMember}
              >
                {isRemovingMember ? 'Unassigning...' : 'Confirm Unassign'}
              </GlossyButton>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE NEW SUB-TEAM ─── */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-accent-cyan" />
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-cyber-primary">
                  Register Sub-Team
                </h3>
              </div>
              <button
                onClick={() => setIsCreateGroupOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-cyber-surface text-cyber-muted hover:text-cyber-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-cyber-secondary mb-1">
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
                  className="w-full h-10 px-3 rounded-lg text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-cyber-secondary mb-1">
                  Sub-Team Slug (URL & Channels) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., aero-cooling"
                  value={newGroupSlug}
                  onChange={(e) => setNewGroupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full h-10 px-3 rounded-lg text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-cyber-secondary mb-1">
                  Scope & Engineering Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Mandate, CAD packages, systems responsibility..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full p-3 rounded-lg text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan font-sans resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-cyber-secondary mb-1">
                  Telemetry Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewGroupColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        newGroupColor === color ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {createGroupError && (
                <div className="p-2.5 rounded bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
                  {createGroupError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyber-border">
                <GhostButton size="sm" onClick={() => setIsCreateGroupOpen(false)}>
                  Cancel
                </GhostButton>
                <GlossyButton variant="primary" size="sm" type="submit" disabled={isCreatingGroup}>
                  {isCreatingGroup ? 'Registering...' : 'Register Sub-Team'}
                </GlossyButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
