import React, { useMemo, useState } from 'react';
import { Search, MessageSquare, Mail, Users } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { EmptyState } from '../common/EmptyState';
import { Group, Profile, Task, UserRole } from '../../lib/database.types';
import { SUB_TEAMS } from '../../lib/constants';
import { canDirectMessage } from '../../lib/permissions';

interface TeamDirectoryProps {
  currentUser: Profile;
  profiles: Profile[];
  groups?: Group[];
  tasks?: Task[];
  onMessage: (userId: string) => void;
}

const ROLE_ORDER: Record<UserRole, number> = { admin: 0, head: 1, member: 2, pending: 3 };
const ROLE_LABEL: Record<UserRole, string> = { admin: 'Club admin', head: 'Group head', member: 'Engineer', pending: 'Pending' };

const shortName = (name: string) => name.replace(/^Technical - |^Operations - /, '');

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({ currentUser, profiles, groups, tasks = [], onMessage }) => {
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const sourceGroups = groups && groups.length > 0 ? groups : SUB_TEAMS;
  const approved = useMemo(() => profiles.filter((p) => p.status === 'approved'), [profiles]);

  const matches = (p: Profile) => {
    const q = query.trim().toLowerCase();
    return !q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  };

  const sections = [
    {
      id: 'leadership',
      name: 'Club leadership',
      description: 'Advisors and administrators across all sub-teams.',
      color: 'var(--accent-cyan)',
      members: approved.filter((p) => p.role === 'admin' || !p.group_id),
    },
    ...sourceGroups.map((g) => ({
      id: g.id,
      name: shortName(g.name),
      description: g.description ?? '',
      color: g.color_accent,
      members: approved.filter((p) => p.group_id === g.id && p.role !== 'admin'),
    })),
  ]
    .filter((s) => groupFilter === 'all' || s.id === groupFilter)
    .map((s) => ({
      ...s,
      openTasks: tasks.filter((t) => t.group_id === s.id && t.status !== 'done' && t.status !== 'approved').length,
      members: s.members.filter(matches).sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.full_name.localeCompare(b.full_name)),
    }))
    .filter((s) => s.members.length > 0 || (!query.trim() && s.id !== 'leadership'));

  const totalShown = sections.reduce((sum, s) => sum + s.members.length, 0);
  const filterOptions = [{ id: 'all', name: 'All' }, { id: 'leadership', name: 'Leadership' }, ...sourceGroups.map((g) => ({ id: g.id, name: shortName(g.name) }))];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team directory"
        title="Who's on the grid"
        description={`${approved.length} active members across ${sourceGroups.length} sub-teams. Find a teammate, see their role and start a conversation.`}
      >
        <div className="space-y-3">
          <div className="relative max-w-md">
            <label htmlFor="team-search" className="sr-only">Search members</label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none" aria-hidden="true" />
            <input
              id="team-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="w-full h-11 pl-10 pr-3 rounded-lg text-sm"
            />
          </div>
          <div role="group" aria-label="Filter by sub-team" className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGroupFilter(opt.id)}
                aria-pressed={groupFilter === opt.id}
                className={`h-9 px-3 shrink-0 rounded-full text-xs font-semibold border transition-colors duration-fast cursor-pointer ${
                  groupFilter === opt.id
                    ? 'bg-accent-cyan text-on-accent border-accent-cyan'
                    : 'bg-cyber-surface text-cyber-secondary border-cyber-border hover:text-cyber-primary hover:border-cyber-border-strong'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <p className="sr-only" aria-live="polite">{`${totalShown} members shown`}</p>

      {totalShown === 0 && query.trim() ? (
        <EmptyState
          illustration="wheel"
          title="No one matches that search"
          description={`We couldn't find anyone named "${query.trim()}". Check the spelling or clear the filter.`}
          actionLabel="Clear search"
          onAction={() => {
            setQuery('');
            setGroupFilter('all');
          }}
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`team-${section.id}`} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-cyber-border pb-2">
                <div className="min-w-0">
                  <h2 id={`team-${section.id}`} className="flex items-center gap-2 font-display font-bold text-base text-cyber-primary tracking-wide">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: section.color }} aria-hidden="true" />
                    {section.name}
                  </h2>
                  {section.description && <p className="text-xs text-cyber-muted mt-0.5">{section.description}</p>}
                </div>
                <p className="text-2xs font-mono uppercase tracking-wide text-cyber-muted">
                  {section.members.length} {section.members.length === 1 ? 'member' : 'members'}
                  {section.id !== 'leadership' && ` · ${section.openTasks} open tasks`}
                </p>
              </div>

              {section.members.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-cyber-muted py-3">
                  <Users className="w-4 h-4" aria-hidden="true" /> No approved members yet.
                </p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {section.members.map((person) => {
                    const isSelf = person.id === currentUser.id;
                    const canMessage = canDirectMessage(currentUser, person);
                    return (
                      <li
                        key={person.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-cyber-surface border border-cyber-border hover:border-cyber-border-strong transition-colors duration-fast"
                      >
                        <ChromeAvatar name={person.full_name} avatarUrl={person.avatar_url} role={person.role} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-cyber-primary truncate">
                            {person.full_name}
                            {isSelf && <span className="ml-1.5 text-2xs font-mono text-accent-cyan">(you)</span>}
                          </p>
                          <p className="text-xs text-cyber-muted truncate">{ROLE_LABEL[person.role]}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={`mailto:${person.email}`}
                            aria-label={`Email ${person.full_name}`}
                            title={person.email}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-cyber-muted hover:text-cyber-primary hover:bg-cyber-surface-hover transition-colors duration-fast"
                          >
                            <Mail className="w-4 h-4" aria-hidden="true" />
                          </a>
                          {canMessage && (
                            <button
                              type="button"
                              onClick={() => onMessage(person.id)}
                              aria-label={`Message ${person.full_name}`}
                              title="Send a direct message"
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-accent-cyan hover:bg-accent-cyan/10 transition-colors duration-fast cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
