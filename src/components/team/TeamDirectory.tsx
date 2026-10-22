import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  Award, 
  MessageSquare, 
  Search, 
  Mail, 
  CheckSquare, 
  Layers,
  Sliders
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { PageHeader } from '../common/PageHeader';
import { StatStrip } from '../common/StatStrip';
import { GlossyButton } from '../common/GlossyButton';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { parseUserIdentity } from '../common/UserLabel';
import { ModalShell } from '../common/ModalShell';
import { SkeletonCard } from '../common/SkeletonCard';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { Profile, Group, Task } from '../../lib/database.types';
import { SUB_TEAMS } from '../../lib/constants';
import { NavTab } from '../layout/BottomNav';

interface TeamDirectoryProps {
  currentUser: Profile;
  allProfiles: Profile[];
  allGroups: Group[];
  tasks: Task[];
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onStartDirectMessage: (userId: string) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  currentUser,
  allProfiles,
  allGroups,
  tasks,
  loading = false,
  onRefresh,
  onStartDirectMessage,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const activeFilterCount =
    (selectedGroupId !== 'all' ? 1 : 0) +
    (selectedRole !== 'all' ? 1 : 0);

  const isPulling = usePullToRefresh(onRefresh);

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
      {/* ─── UNIFIED HEADER & STATS ─── */}
      <PageHeader
        title="Team Directory & Roster"
        eyebrow="Telemetry Roster • 5 Sub-Teams"
        description="Engineering structure, sub-team leads, active personnel, and direct telemetry dispatch."
        actions={
          <>
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
          </>
        }
        stats={
          <StatStrip
            items={[
              { label: 'Active Roster', value: totalEngineers },
              { label: 'Sub-Teams', value: groupsList.length },
              { label: 'Group Heads', value: totalHeads, tone: 'yellow' },
              { label: 'Club Advisory', value: totalAdmins, tone: 'lime' },
            ]}
          />
        }
      />

      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="py-2 text-center text-label font-mono text-accent-cyan animate-pulse">
          RELEASE TO REFRESH ROSTER…
        </div>
      )}

      {/* ─── Compact Mobile Toolbar (< md) ─── */}
      <div className="md:hidden flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search engineers…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-9 pr-3 rounded-lg text-sm font-sans bg-cyber-bg-alt border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className={`h-11 px-3.5 rounded-lg border flex items-center gap-2 text-xs font-sans font-semibold transition-all shrink-0 cursor-pointer ${
            activeFilterCount > 0
              ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.25)]'
              : 'bg-cyber-bg-alt border-cyber-border text-cyber-secondary hover:text-cyber-primary'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent-cyan text-black text-label font-sans font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── Mobile Filter Sheet ─── */}
      <ModalShell
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Team Directory"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <GlossyButton
              variant="ghost"
              size="sm"
              disabled={activeFilterCount === 0}
              onClick={() => {
                setSelectedGroupId('all');
                setSelectedRole('all');
              }}
            >
              Reset Filters
            </GlossyButton>
            <GlossyButton
              variant="primary"
              size="sm"
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Show {filteredProfiles.length} Members
            </GlossyButton>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {/* Sub-team division */}
          <div>
            <label className="block text-label font-mono uppercase tracking-wider text-cyber-muted mb-2">
              Sub-Team Division
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedGroupId('all')}
                className={`min-h-[44px] px-3 py-2 rounded-lg border text-left text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedGroupId === 'all'
                    ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan font-bold'
                    : 'bg-cyber-bg-alt border-cyber-border text-cyber-secondary'
                }`}
              >
                <span>ALL SUB-TEAMS</span>
                <span className="text-label px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border">
                  {approvedProfiles.length}
                </span>
              </button>
              {groupsList.map((g) => {
                const count = approvedProfiles.filter((p) => p.group_id === g.id).length;
                const isSelected = selectedGroupId === g.id;
                const accent = g.color_accent || '#00D9FF';
                const shortName = g.name.replace(/^Technical - |^Operations - /, '');

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-lg border text-left text-xs font-mono flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan font-bold'
                        : 'bg-cyber-bg-alt border-cyber-border text-cyber-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                      <span className="truncate">{shortName}</span>
                    </div>
                    <span className="text-label px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-label font-mono uppercase tracking-wider text-cyber-muted mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-mono uppercase transition-colors text-center ${
                      isSelected
                        ? 'bg-accent-cyan text-black font-bold border-accent-cyan'
                        : 'bg-cyber-bg-alt border-cyber-border text-cyber-secondary'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModalShell>

      {/* ─── 5 Sub-Teams Quick Filter Overview (Desktop) ─── */}
      <div className="hidden md:block">
        <GlassCard variant="flat" className="space-y-2.5">
        <div className="flex items-center justify-between text-label font-sans uppercase tracking-wider text-cyber-muted">
          <span className="text-label font-sans font-semibold text-cyber-secondary md:font-bold md:text-cyber-primary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-accent-cyan" />
            <span>SUB-TEAM DIVISIONS</span>
          </span>
          <span>Click to filter personnel</span>
        </div>

        <div className="-mx-3.5 px-3.5 flex sm:grid sm:grid-cols-3 md:grid-cols-6 gap-2 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none mask-fade-edges sm:[mask-image:none]">
          {/* "All" Filter Button */}
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`
              shrink-0 snap-start min-w-[130px] sm:min-w-0 min-h-[44px] flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer
              ${
                selectedGroupId === 'all'
                  ? 'bg-cyber-surface-elevated border-accent-cyan text-cyber-primary shadow-cyber-sm'
                  : 'bg-cyber-bg-alt border-cyber-border text-cyber-secondary hover:border-cyber-border-strong hover:text-cyber-primary'
              }
            `}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-label font-mono uppercase font-medium">ALL TEAMS</span>
              <span className="text-label font-mono px-1 rounded bg-cyber-surface border border-cyber-border">
                {approvedProfiles.length}
              </span>
            </div>
            <span className="text-label font-sans truncate font-medium mt-1">Full Roster</span>
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
                  shrink-0 snap-start min-w-[130px] sm:min-w-0 min-h-[44px] flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden
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
                    <span className="text-label font-mono uppercase truncate max-w-[9rem] text-cyber-muted">
                      {g.slug}
                    </span>
                  </div>
                  <span className="text-label font-mono px-1 rounded bg-cyber-surface border border-cyber-border">
                    {count}
                  </span>
                </div>
                <span className="text-label font-sans truncate max-w-[9rem] font-medium mt-1">
                  {shortName}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>
      </div>

      {/* ─── Search & Role Filters Bar (Desktop) ─── */}
      <div className="hidden md:block">
        <GlassCard variant="flat" className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search engineers by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] sm:min-h-0 sm:h-9 pl-9 pr-3 rounded-lg text-base sm:text-xs font-sans bg-cyber-bg-alt border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan transition-colors"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-label font-mono text-cyber-muted uppercase tracking-wider mr-1 hidden sm:inline">
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
                  min-h-[40px] px-3.5 py-2 rounded text-label font-mono font-medium uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap
                  ${
                    isSelected
                      ? 'bg-accent-cyan text-black font-medium border-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.3)]'
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
      </div>

      {/* ─── Members Grid ─── */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : filteredProfiles.length === 0 ? (
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
            const { displayName, studentId } = parseUserIdentity(person.full_name, person.email);

            return (
              <GlassCard
                key={person.id}
                variant="elevated"
                className="p-4 flex flex-col justify-between space-y-3.5 border-cyber-border hover:border-cyber-border-strong active:scale-[0.99] transition-all relative overflow-hidden"
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
                        name={displayName}
                        role={person.role}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-sans font-semibold text-base text-cyber-primary truncate">
                            {displayName}
                          </h4>
                          {isSelf && (
                            <span className="hidden sm:inline-block text-label font-mono px-1 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-label font-mono text-cyber-muted truncate mt-0.5">
                          <span className="inline-flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{person.email}</span>
                          </span>
                          {studentId && (
                            <span className="shrink-0 px-1 rounded bg-cyber-bg-alt border border-cyber-border text-cyber-muted">
                              #{studentId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role Chip */}
                    <div className="flex-shrink-0">
                      {person.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label font-mono uppercase bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30">
                          <Shield className="w-3 h-3" />
                          <span>Admin</span>
                        </span>
                      ) : person.role === 'head' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label font-mono uppercase bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30">
                          <Award className="w-3 h-3" />
                          <span>Lead</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label font-mono uppercase bg-cyber-surface text-cyber-primary border border-cyber-border">
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

                    <div className="flex items-center gap-1 text-label font-mono text-cyber-muted flex-shrink-0">
                      <CheckSquare className="w-3 h-3 text-accent-cyan" />
                      <span>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-cyber-border flex items-center justify-between gap-2">
                  <div className="text-label font-mono text-cyber-muted">
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
