import { Profile } from './database.types';

// UI convenience only — authorization is enforced by RLS in the database.
export const canDirectMessage = (currentUser: Profile, target: Profile): boolean => {
  if (target.id === currentUser.id || target.status !== 'approved') return false;
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'head') {
    return target.group_id === currentUser.group_id || target.role === 'head' || target.role === 'admin';
  }
  if (currentUser.role === 'member') {
    return target.group_id === currentUser.group_id || target.role === 'admin';
  }
  return false;
};
