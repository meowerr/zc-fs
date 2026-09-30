import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured, isDemoMode } from '../lib/supabase';
import { Profile, UserRole, UserStatus } from '../lib/database.types';
import { MOCK_PROFILES } from '../lib/demoData';

export const UNIVERSITY_DOMAIN = 'zewailcity.edu.eg';

export function isUniversityEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith(`@${UNIVERSITY_DOMAIN}`);
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    if (!isDemoMode) return null;
    const saved = localStorage.getItem('zcfs_demo_user');
    if (saved && MOCK_PROFILES[saved]) {
      return MOCK_PROFILES[saved];
    }
    return MOCK_PROFILES['kareem.vd@zewailcity.edu.eg'] || null;
  });
  const [allProfiles, setAllProfiles] = useState<Profile[]>(() => 
    isDemoMode ? Object.values(MOCK_PROFILES) : []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch or sync user profile
  const fetchProfile = useCallback(async (userId: string, userEmail: string) => {
    if (!isLiveSupabaseConfigured) {
      const mock = MOCK_PROFILES[userEmail];
      if (mock) {
        setCurrentUser(mock);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr) {
        throw profileErr;
      }

      setCurrentUser(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch user profile';
      console.error('Profile fetch error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLiveSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In function
  const signIn = async (email: string, password?: string) => {
    setError(null);
    if (!isUniversityEmail(email)) {
      const err = `Access restricted: Email must end in @${UNIVERSITY_DOMAIN}`;
      setError(err);
      throw new Error(err);
    }

    if (!isLiveSupabaseConfigured) {
      // Demo authentication simulation
      const found = allProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('zcfs_demo_user', found.email);
        return;
      }
      // If new email in demo mode, create as pending
      const newPending: Profile = {
        id: `mock-${Date.now()}`,
        email: email.toLowerCase(),
        full_name: email.split('@')[0].replace('.', ' '),
        avatar_url: null,
        phone: null,
        role: 'pending',
        group_id: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAllProfiles((prev) => [...prev, newPending]);
      setCurrentUser(newPending);
      localStorage.setItem('zcfs_demo_user', newPending.email);
      return;
    }

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'temporary123',
    });

    if (authErr) {
      setError(authErr.message);
      throw authErr;
    }
  };

  // Sign Up function
  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    if (!isUniversityEmail(email)) {
      const err = `Registration denied: Only @${UNIVERSITY_DOMAIN} accounts are authorized.`;
      setError(err);
      throw new Error(err);
    }

    if (!isLiveSupabaseConfigured) {
      const newProfile: Profile = {
        id: `mock-${Date.now()}`,
        email: email.toLowerCase(),
        full_name: fullName,
        avatar_url: null,
        phone: null,
        role: 'pending',
        group_id: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAllProfiles((prev) => [...prev, newProfile]);
      setCurrentUser(newProfile);
      localStorage.setItem('zcfs_demo_user', newProfile.email);
      return;
    }

    const { error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authErr) {
      setError(authErr.message);
      throw authErr;
    }
  };

  // Sign Out function
  const signOut = async () => {
    localStorage.removeItem('zcfs_demo_user');
    // Flush service worker and browser caches on logout
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      } catch (e) {
        console.warn('Failed to clear cache on logout:', e);
      }
    }
    if (!isLiveSupabaseConfigured) {
      setCurrentUser(null);
      return;
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Switch demo persona (for instant local testing)
  const switchDemoPersona = (email: string) => {
    const target = allProfiles.find((p) => p.email === email) || MOCK_PROFILES[email];
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('zcfs_demo_user', target.email);
    }
  };

  // Admin approval action: assigns group & role and sets status to 'approved'
  const approveUser = async (userId: string, groupId: string, role: UserRole) => {
    if (!isLiveSupabaseConfigured) {
      setAllProfiles((prev) =>
        prev.map((p) =>
          p.id === userId
            ? { ...p, status: 'approved' as UserStatus, group_id: groupId, role }
            : p
        )
      );
      if (currentUser?.id === userId) {
        setCurrentUser((prev) =>
          prev ? { ...prev, status: 'approved', group_id: groupId, role } : null
        );
      }
      return;
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        status: 'approved',
        group_id: groupId,
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) {
      throw updateErr;
    }

    if (currentUser?.id === userId) {
      fetchProfile(userId, currentUser.email);
    }
  };

  // Admin reject action
  const rejectUser = async (userId: string) => {
    if (!isLiveSupabaseConfigured) {
      setAllProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, status: 'rejected' as UserStatus } : p))
      );
      return;
    }

    const { error: rejectErr } = await supabase
      .from('profiles')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (rejectErr) {
      throw rejectErr;
    }
  };

  return {
    currentUser,
    allProfiles,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    switchDemoPersona,
    approveUser,
    rejectUser,
    isLiveConfigured: isLiveSupabaseConfigured,
  };
}
