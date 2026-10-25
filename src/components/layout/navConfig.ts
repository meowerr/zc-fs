import { LayoutDashboard, CheckSquare, MessageSquare, Users, ShieldCheck, LucideIcon } from 'lucide-react';
import { UserRole } from '../../lib/database.types';

export type NavTab = 'dashboard' | 'tasks' | 'chat' | 'team' | 'admin';

export interface NavItem {
  id: NavTab;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const getNavItems = (role: UserRole): NavItem[] => [
  { id: 'dashboard', label: 'Mission Control', shortLabel: 'Home', description: 'Overview and priorities', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', shortLabel: 'Tasks', description: 'Deliverables and reviews', icon: CheckSquare },
  { id: 'chat', label: 'Pit Wall', shortLabel: 'Chat', description: 'Channels and direct messages', icon: MessageSquare },
  { id: 'team', label: 'Team', shortLabel: 'Team', description: 'Sub-teams and people', icon: Users },
  ...(role === 'admin'
    ? [{ id: 'admin' as NavTab, label: 'Admin', shortLabel: 'Admin', description: 'Approvals and access', icon: ShieldCheck }]
    : []),
];
