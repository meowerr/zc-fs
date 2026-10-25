import React, { useState } from 'react';
import { X, Search, MessageSquare } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GhostButton } from '../common/GhostButton';
import { Modal, ModalCloseButton } from '../common/Modal';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Profile } from '../../lib/database.types';
import { SUB_TEAMS } from '../admin/AdminApprovalHub';

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

  if (!isOpen) return null;

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

  return (
    <Modal onClose={onClose} labelledBy="new-dm-title">
      <GlassCard variant="elevated" cornerMark={false} className="w-full max-w-md p-5 sm:p-6 rounded-b-none sm:rounded-b-xl border-cyber-border-strong shadow-cyber-elevated space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" aria-hidden="true">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 id="new-dm-title" className="font-display font-bold text-base text-cyber-primary tracking-wide">
              New direct message
            </h3>
          </div>
          <ModalCloseButton onClick={onClose}>
            <X className="w-4 h-4" aria-hidden="true" />
          </ModalCloseButton>
        </div>

        <div className="relative">
          <label htmlFor="new-dm-search" className="sr-only">Search engineers</label>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none" aria-hidden="true" />
          <input
            id="new-dm-search"
            data-autofocus
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg text-sm font-sans"
          />
        </div>

        {/* User list */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {filtered.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-cyber-muted">
              {search.trim()
                ? `No one matches "${search.trim()}". You can message your sub-team and club admins.`
                : 'No one is available to message yet.'}
            </div>
          ) : (
            filtered.map((user) => {
              const team = SUB_TEAMS.find((t) => t.id === user.group_id);

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user.id);
                    onClose();
                  }}
                  type="button"
                  className="w-full min-h-[52px] p-2.5 rounded-lg flex items-center justify-between gap-3 text-left hover:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer border border-cyber-border/60 hover:border-accent-cyan/50 bg-cyber-surface"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChromeAvatar name={user.full_name} role={user.role} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-cyber-primary truncate">
                        {user.full_name}
                      </div>
                      <div className="font-mono text-2xs text-cyber-muted truncate">
                        {team ? team.name.replace('Technical - ', '') : 'Club Leadership'} • {user.role.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-2xs text-accent-cyan font-bold flex-shrink-0">
                    Chat &rarr;
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-cyber-border flex justify-end">
          <GhostButton size="sm" onClick={onClose}>
            Cancel
          </GhostButton>
        </div>
      </GlassCard>
    </Modal>
  );
};
