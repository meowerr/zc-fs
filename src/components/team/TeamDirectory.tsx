import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  Award, 
  MessageSquare, 
  Search, 
  Mail, 
  CheckSquare, 
  Layers
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Profile, Group, Task } from '../../lib/database.types';
import { SUB_TEAMS } from '../../lib/constants';
import { NavTab } from '../layout/BottomNav';

interface TeamDirectoryProps {
  currentUser: Profile;
  allProfiles: Profile[];
  allGroups: Group[];
  tasks: Task[];
  onStartDirectMessage: (userId: string) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  currentUser,
  allProfiles,
  allGroups,
  tasks,
  onStartDirectMessage,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Groups list fallback
  const groupsList = (allGroups && allGroups.length > 0) ? allGroups : SUB_TEAMS;

  // Active approved members
  const approvedProfiles = useMemo(() => {
    return allProfiles.filter((p) => p.status === 'approved');
  }, [allProfiles]);

  // Telemetry Metrics
  const totalEngineers = approvedProfiles.length;
  const totalHeads = approvedProfiles.filter((p) => p.role === 'head').length;
  const totalAdmins = approvedProfiles.filter((p) => p.role === 'admin').length;

  // Helper to get group metadata
  const getGroupMeta = (groupId: string | null) => {
    if (!groupId) return null;
    return groupsList.find((g) => g.id === groupId) || SUB_TEAMS.find((g) => g.id === groupId);
  };

  // Helper to get team accent color
  const getGroupColor = (groupId: string | null) => {
    const meta = getGroupMeta(groupId);
    return meta?.color_accent || '#00D9FF';
  };

  // Filtered members list
  const filteredProfiles = useMemo(() => {
    return approvedProfiles.filter((p) => {
      // Sub-team filter
      if (selectedGroupId !== 'all') {
        if (selectedGroupId === 'unassigned') {
          if (p.group_id !== null) return false;
        } else {
          if (p.group_id !== selectedGroupId) return false;
        }
      }

      // Role filter
      if (selectedRole !== 'all' && p.role !== selectedRole) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.full_name?.toLowerCase().includes(query);
        const matchesEmail = p.email?.toLowerCase().includes(query);
        const group = getGroupMeta(p.group_id);
        const matchesGroup = group?.name?.toLowerCase().includes(query);
        const matchesRole = p.role?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesGroup && !matchesRole) {
          return false;
        }
      }

      return true;
    });
  }, [approvedProfiles, selectedGroupId, selectedRole, searchTerm, groupsList]);

  // Tasks assigned per member count
  const getMemberTaskCount = (userId: string) => {
    return tasks.filter((t) => {
      return Boolean(t.assignees && t.assignees.some((a) => a.id === userId));
    }).length;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Top Telemetry Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-accent-cyan tracking-widest uppercase bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/20 font-bold">
              // TELEMETRY ROSTER
            </span>
            <span className="text-[10px] font-mono text-cyber-muted">
              5 SUB-TEAMS • ACTIVE DIRECTORY
            </span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-cyber-primary tracking-wide uppercase mt-1">
            Team Directory & Roster
          </h1>
          <p className="text-xs font-sans text-cyber-secondary mt-0.5">
            Engineering structure, sub-team leads, active personnel, and direct telemetry dispatch.
          </p>
        </div>

        {/* Quick Hub Navigation Actions */}
        <div className="flex items-center gap-2">
          <GlossyButton
            size="sm"
            variant="outline"
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            onClick={() => onNavigateTab('chat')}
          >
            Pit Wall Comms
          </GlossyButton>
          <GlossyButton
            size="sm"
            variant="secondary"
            icon={<CheckSquare className="w-3.5 h-3.5" />}
            onClick={() => onNavigateTab('tasks')}
          >
            Tasks Hub
          </GlossyButton>
        </div>
      </div>

      {/* ─── Telemetry HUD Metrics Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard className="p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-muted mb-1 font-mono text-[10px] uppercase">
            <span>ACTIVE ROSTER</span>
            <Users className="w-3.5 h-3.5 text-accent-cyan" />
          </div>
          <div className="font-mono text-2xl font-bold text-cyber-primary">
            {totalEngineers.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] font-mono text-cyber-secondary mt-0.5">
            Verified university engineers
          </div>
        </GlassCard>

        <GlassCard className="p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-muted mb-1 font-mono text-[10px] uppercase">
            <span>SUB-TEAMS</span>
            <Layers className="w-3.5 h-3.5 text-accent-orange" />
          </div>
          <div className="font-mono text-2xl font-bold text-cyber-primary">
            {groupsList.length.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] font-mono text-cyber-secondary mt-0.5">
            Specialized engineering divisions
          </div>
        </GlassCard>

        <GlassCard className="p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-muted mb-1 font-mono text-[10px] uppercase">
            <span>GROUP HEADS</span>
            <Award className="w-3.5 h-3.5 text-accent-yellow" />
          </div>
          <div className="font-mono text-2xl font-bold text-cyber-primary">
            {totalHeads.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] font-mono text-cyber-secondary mt-0.5">
            Sub-team leads & reviewers
          </div>
        </GlassCard>

        <GlassCard className="p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyber-muted mb-1 font-mono text-[10px] uppercase">
            <span>CLUB ADVISORY</span>
            <Shield className="w-3.5 h-3.5 text-accent-lime" />
          </div>
          <div className="font-mono text-2xl font-bold text-cyber-primary">
            {totalAdmins.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] font-mono text-cyber-secondary mt-0.5">
            System overseers & faculty
          </div>
        </GlassCard>
      </div>

      {/* ─── 5 Sub-Teams Quick Filter Overview ─── */}
      <GlassCard className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-cyber-muted">
          <span className="flex items-center gap-1.5 font-bold text-cyber-primary">
            <Layers className="w-3.5 h-3.5 text-accent-cyan" />
            <span>SUB-TEAM DIVISIONS</span>
          </span>
          <span>Click to filter personnel</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {/* "All" Filter Button */}
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`
              flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer
              ${
                selectedGroupId === 'all'
                  ? 'bg-cyber-surface-elevated border-accent-cyan text-cyber-primary shadow-cyber-sm'
                  : 'bg-cyber-bg-alt border-cyber-border text-cyber-secondary hover:border-cyber-border-strong hover:text-cyber-primary'
              }
            `}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono uppercase font-bold">ALL TEAMS</span>
              <span className="text-[10px] font-mono px-1 rounded bg-cyber-surface border border-cyber-border">
                {approvedProfiles.length}
              </span>
            </div>
            <span className="text-[11px] font-sans truncate font-medium mt-1">Full Roster</span>
          </button>

          {/* Individual Sub-teams */}
          {groupsList.map((g) => {
            const count = approvedProfiles.filter((p) => p.group_id === g.id).length;
            const isSelected = selectedGroupId === g.id;
            const accent = g.color_accent || '#00D9FF';
            const shortName = g.name.replace(/^Technical - |^Operations - /, '');

            return (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`
                  flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden
                  ${
                    isSelected
                      ? 'bg-cyber-surface-elevated text-cyber-primary shadow-cyber-sm'
                      : 'bg-cyber-bg-alt border-cyber-border text-cyber-secondary hover:border-cyber-border-strong hover:text-cyber-primary'
                  }
                `}
                style={{
                  borderColor: isSelected ? accent : undefined,
                }}
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 inset-x-0 h-[2px]"
                  style={{ backgroundColor: accent }}
                />

                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="text-[9px] font-mono uppercase truncate text-cyber-muted">
                      {g.slug}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1 rounded bg-cyber-surface border border-cyber-border">
                    {count}
                  </span>
                </div>
                <span className="text-[11px] font-sans truncate font-medium mt-1">
                  {shortName}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* ─── Search & Role Filters Bar ─── */}
      <GlassCard className="p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search engineers by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-xs font-sans bg-cyber-bg-alt border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan transition-colors"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider mr-1 hidden sm:inline">
            ROLE:
          </span>
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'admin', label: 'Club Admin' },
            { id: 'head', label: 'Group Heads' },
            { id: 'member', label: 'Engineers' },
          ].map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`
                  px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap
                  ${
                    isSelected
                      ? 'bg-accent-cyan text-black font-bold border-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.3)]'
                      : 'bg-cyber-surface-elevated border-cyber-border text-cyber-secondary hover:text-cyber-primary hover:border-cyber-border-strong'
                  }
                `}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* ─── Members Grid ─── */}
      {filteredProfiles.length === 0 ? (
        <GlassCard className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-cyber-bg-alt border border-cyber-border flex items-center justify-center mx-auto text-cyber-muted">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-sm text-cyber-primary uppercase tracking-wider">
            No Matching Personnel Found
          </h3>
          <p className="text-xs text-cyber-secondary max-w-sm mx-auto font-sans">
            Try adjusting your search query, sub-team filter, or role selector.
          </p>
          <GlossyButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setSelectedGroupId('all');
              setSelectedRole('all');
            }}
          >
            Reset Filters
          </GlossyButton>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProfiles.map((person) => {
            const groupMeta = getGroupMeta(person.group_id);
            const groupColor = getGroupColor(person.group_id);
            const taskCount = getMemberTaskCount(person.id);
            const isSelf = person.id === currentUser.id;

            return (
              <GlassCard
                key={person.id}
                variant="elevated"
                className="p-4 flex flex-col justify-between space-y-3.5 border-cyber-border hover:border-cyber-border-strong transition-all relative overflow-hidden"
              >
                {/* Colored team identity line on top edge */}
                <div
                  className="absolute top-0 inset-x-0 h-[2px]"
                  style={{ backgroundColor: groupColor }}
                />

                {/* Person Header: Avatar + Name + Role */}
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ChromeAvatar
                        name={person.full_name}
                        role={person.role}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display font-bold text-sm text-cyber-primary truncate">
                            {person.full_name}
                          </h4>
                          {isSelf && (
                            <span className="text-[9px] font-mono px-1 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-cyber-muted truncate mt-0.5">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{person.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role Chip */}
                    <div className="flex-shrink-0">
                      {person.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30">
                          <Shield className="w-3 h-3" />
                          <span>Admin</span>
                        </span>
                      ) : person.role === 'head' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30">
                          <Award className="w-3 h-3" />
                          <span>Lead</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-cyber-surface text-cyber-secondary border border-cyber-border">
                          <span>Engineer</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sub-team Badge & Details */}
                  <div className="mt-3 pt-2.5 border-t border-cyber-border flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: groupColor }}
                      />
                      <span className="text-cyber-secondary truncate font-sans text-xs">
                        {groupMeta ? groupMeta.name.replace(/^Technical - |^Operations - /, '') : 'All-Club / Advisor'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-cyber-muted flex-shrink-0">
                      <CheckSquare className="w-3 h-3 text-accent-orange" />
                      <span>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-cyber-border flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-cyber-muted">
                    STATUS: <span className="text-accent-lime font-bold">ONLINE</span>
                  </div>

                  {!isSelf && (
                    <GlossyButton
                      size="sm"
                      variant="outline"
                      icon={<MessageSquare className="w-3 h-3" />}
                      onClick={() => {
                        onStartDirectMessage(person.id);
                        onNavigateTab('chat');
                      }}
                    >
                      Transmit DM
                    </GlossyButton>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
