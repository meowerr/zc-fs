import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Users,
  MessageSquare,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '../lib/database.types';

export type NavTab = 'dashboard' | 'tasks' | 'chat' | 'docs' | 'team' | 'admin';

export type NavGroupId = 'SYSTEM' | 'OPERATIONS' | 'COMMS' | 'ADMIN';

export interface NavGroupConfig {
  id: NavGroupId;
  label: string;
}

export const NAV_GROUPS: readonly NavGroupConfig[] = [
  { id: 'SYSTEM', label: 'SYSTEM' },
  { id: 'OPERATIONS', label: 'OPERATIONS' },
  { id: 'COMMS', label: 'COMMS' },
  { id: 'ADMIN', label: 'ADMIN' },
] as const;

export interface NavItemConfig {
  id: NavTab;
  label: string;
  shortLabel: string;
  subtitle: string;
  group: NavGroupId;
  icon: LucideIcon;
  allowedRoles: readonly UserRole[];
  badgeKey?: 'chat' | 'notifications';
}

export const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Mission Control',
    shortLabel: 'Control',
    subtitle: 'Overview & Velocity',
    group: 'SYSTEM',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'head', 'member', 'pending'],
  },
  {
    id: 'tasks',
    label: 'Tasks Telemetry',
    shortLabel: 'Tasks',
    subtitle: 'Review & Deliverables',
    group: 'OPERATIONS',
    icon: CheckSquare,
    allowedRoles: ['admin', 'head', 'member', 'pending'],
  },
  {
    id: 'docs',
    label: 'Engineering Hub',
    shortLabel: 'Docs',
    subtitle: 'CAD & Specs Library',
    group: 'OPERATIONS',
    icon: FileText,
    allowedRoles: ['admin', 'head', 'member', 'pending'],
  },
  {
    id: 'team',
    label: 'Team Directory',
    shortLabel: 'Team',
    subtitle: '5 Sub-Teams & Roles',
    group: 'OPERATIONS',
    icon: Users,
    allowedRoles: ['admin', 'head', 'member', 'pending'],
  },
  {
    id: 'chat',
    label: 'Pit Wall Chat',
    shortLabel: 'Pit Wall',
    subtitle: 'Channels & DMs',
    group: 'COMMS',
    icon: MessageSquare,
    allowedRoles: ['admin', 'head', 'member', 'pending'],
    badgeKey: 'chat',
  },
  {
    id: 'admin',
    label: 'Admin Hub',
    shortLabel: 'Admin',
    subtitle: 'Approvals & Access',
    group: 'ADMIN',
    icon: ShieldAlert,
    allowedRoles: ['admin'],
  },
] as const;

/**
 * Returns all navigation items visible to a specific user role.
 */
export function getVisibleNavItems(role: UserRole): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));
}

/**
 * Returns active navigation groups that have at least one visible item for the given role.
 */
export function getNavGroupsForRole(role: UserRole): NavGroupId[] {
  const visibleItems = getVisibleNavItems(role);
  const activeGroups = new Set(visibleItems.map((item) => item.group));
  return NAV_GROUPS.map((g) => g.id).filter((groupId) => activeGroups.has(groupId));
}

/**
 * Returns navigation items belonging to a specific group that are visible to the given role.
 */
export function getNavItemsByGroup(group: NavGroupId, role: UserRole): NavItemConfig[] {
  return NAV_ITEMS.filter(
    (item) => item.group === group && item.allowedRoles.includes(role)
  );
}
