import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ModalShell } from '../common/ModalShell';
import { GhostButton } from '../common/GhostButton';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { parseUserIdentity } from '../common/UserLabel';
import { Profile } from '../../lib/database.types';
import { SUB_TEAMS } from '../../lib/constants';

interface NewDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  allProfiles: Profile[];
  onSelectUser: (userId: string) => void;
}

export const NewDMModal: React.FC<NewDMModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allProfiles,
  onSelectUser,
}) => {
  const [search, setSearch] = useState('');

  // Filter users permitted for DM based on role & sub-team
  const permittedUsers = allProfiles.filter((p) => {
    if (p.id === currentUser.id) return false;
    if (p.status !== 'approved') return false;

    // Admin can DM anyone
    if (currentUser.role === 'admin') return true;

    // Head can DM anyone in own group, any other Head, and Admin
    if (currentUser.role === 'head') {
      return (
        p.group_id === currentUser.group_id ||
        p.role === 'head' ||
        p.role === 'admin'
      );
    }

    // Member can DM people in own group or Admin
    if (currentUser.role === 'member') {
      return p.group_id === currentUser.group_id || p.role === 'admin';
    }

    return false;
  });

  const filtered = permittedUsers.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  const modalFooter = (
    <div className="flex justify-end">
      <GhostButton size="sm" onClick={onClose}>
        Cancel
      </GhostButton>
    </div>
  );

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title="Start Direct Message"
      footer={modalFooter}
      maxWidth="md:max-w-md"
    >
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search engineers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] pl-9 pr-4 rounded-xl text-sm bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan placeholder:text-cyber-muted font-sans"
          />
        </div>

        {/* User list */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-cyber-muted italic">
              No matching engineers found in your permitted communication scope.
            </div>
          ) : (
            filtered.map((user) => {
              const team = SUB_TEAMS.find((t) => t.id === user.group_id);
                  const { displayName, studentId } = parseUserIdentity(user.full_name, user.email);

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user.id);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left hover:bg-cyber-surface-hover transition-all cursor-pointer border border-cyber-border/40 hover:border-accent-cyan/40 bg-cyber-surface min-h-[48px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChromeAvatar name={displayName} role={user.role} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-cyber-primary truncate">
                        {displayName}
                      </div>
                      <div className="font-mono text-label text-cyber-muted truncate flex items-center gap-1.5">
                        <span>{team ? team.name.replace('Technical - ', '') : 'Club Leadership'} • {user.role.toUpperCase()}</span>
                        {studentId && <span className="text-text-muted">#{studentId}</span>}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-label text-accent-cyan font-medium flex-shrink-0">
                    Chat &rarr;
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </ModalShell>
  );
};
