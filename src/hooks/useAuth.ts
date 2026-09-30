import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../lib/database.types';

export const UNIVERSITY_DOMAIN = 'zewailcity.edu.eg';

export function isUniversityEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith(`@${UNIVERSITY_DOMAIN}`);
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all accessible profiles (scoped by database RLS)
  const fetchAllProfiles = useCallback(async () => {
    if (!isLiveSupabaseConfigured) return;
    try {
      const { data, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesErr) {
        console.warn('Profiles fetch notice:', profilesErr.message);
        return;
      }
      if (data) {
        setAllProfiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch all profiles:', err);
    }
  }, []);

  // Fetch or sync user profile strictly from database
  const fetchProfile = useCallback(async (userId: string) => {
    if (!isLiveSupabaseConfigured) {
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
      // Once current user profile is resolved, load all accessible profiles
      fetchAllProfiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch user profile';
      console.error('Profile fetch error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchAllProfiles]);

  useEffect(() => {
    if (!isLiveSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Check existing authenticated session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setAllProfiles([]);
        setLoading(false);
      }
    });

    // 3. Realtime listener for profile changes (e.g. Admin approval / group assignment)
    const profileChannel = supabase
      .channel('public:profiles_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          fetchAllProfiles();
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && payload.new && (payload.new as Profile).id === session.user.id) {
              setCurrentUser(payload.new as Profile);
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [fetchProfile, fetchAllProfiles]);

  // Sign In function (strictly Supabase Auth)
  const signIn = async (email: string, password?: string) => {
    setError(null);
    if (!isUniversityEmail(email)) {
      const err = `Access restricted: Email must end in @${UNIVERSITY_DOMAIN}`;
      setError(err);
      throw new Error(err);
    }

    if (!isLiveSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
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

  // Sign Up function (strictly Supabase Auth with university domain verification)
  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    if (!isUniversityEmail(email)) {
      const err = `Registration denied: Only @${UNIVERSITY_DOMAIN} accounts are authorized.`;
      setError(err);
      throw new Error(err);
    }

    if (!isLiveSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
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

  // Sign Out function (clears session and browser caches)
  const signOut = async () => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      } catch (e) {
        console.warn('Failed to clear cache on logout:', e);
      }
    }
    if (isLiveSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setAllProfiles([]);
  };

  // Admin approval action: assigns group & role and sets status to 'approved'
  const approveUser = async (userId: string, groupId: string, role: UserRole) => {
    if (!isLiveSupabaseConfigured) return;

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

    await fetchAllProfiles();

    if (currentUser?.id === userId) {
      fetchProfile(userId);
    }
  };

  // Admin reject action
  const rejectUser = async (userId: string) => {
    if (!isLiveSupabaseConfigured) return;

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

    await fetchAllProfiles();
  };

  return {
    currentUser,
    allProfiles,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    approveUser,
    rejectUser,
    isLiveConfigured: isLiveSupabaseConfigured,
  };
}
