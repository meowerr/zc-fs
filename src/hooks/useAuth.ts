import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole, Group } from '../lib/database.types';

export const UNIVERSITY_DOMAIN = 'zewailcity.edu.eg';

export function isUniversityEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith(`@${UNIVERSITY_DOMAIN}`);
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all official groups
  const fetchAllGroups = useCallback(async () => {
    if (!isLiveSupabaseConfigured) return;
    try {
      const { data, error: groupsErr } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (groupsErr) {
        console.warn('Groups fetch notice:', groupsErr.message);
        return;
      }
      if (data) {
        setAllGroups(data);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, []);

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

    // Initial fetch of groups and session
    fetchAllGroups();

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

    // 4. Realtime listener for group changes (e.g. Admin creates new group)
    const groupChannel = supabase
      .channel('public:groups_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups' },
        () => {
          fetchAllGroups();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [fetchProfile, fetchAllProfiles, fetchAllGroups]);

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

  // Admin create new sub-team / group (strictly authorized via RLS)
  const createGroup = async (name: string, slug: string, description: string, colorAccent?: string) => {
    if (!isLiveSupabaseConfigured) return null;
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Club Administrators may create sub-teams.');
    }

    const trimmedName = name.trim();
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    if (!trimmedName) throw new Error('Sub-team name is required.');
    if (!cleanSlug) throw new Error('Sub-team slug is required.');

    const { data: newGroup, error: groupErr } = await supabase
      .from('groups')
      .insert({
        name: trimmedName,
        slug: cleanSlug,
        description: description?.trim() || null,
        color_accent: colorAccent || '#2F6BFF',
      })
      .select('*')
      .single();

    if (groupErr) throw groupErr;

    // Automatically create the dedicated sub-team channel for the new group
    if (newGroup) {
      await supabase.from('channels').insert({
        name: `${newGroup.name.replace(/^Technical - |^Operations - /, '')} Telemetry`,
        slug: `ch-${newGroup.slug}`,
        channel_type: 'group',
        group_id: newGroup.id,
        description: `${newGroup.name} sub-team engineering channel.`,
      });
    }

    await fetchAllGroups();
    return newGroup as Group;
  };

  // Admin remove member from group (sets to pending, releases from group scope while keeping history)
  const removeMemberFromGroup = async (userId: string) => {
    if (!isLiveSupabaseConfigured) return;
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Club Administrators may manage sub-team rosters.');
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        status: 'pending',
        role: 'pending',
        group_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    await fetchAllProfiles();

    if (currentUser?.id === userId) {
      fetchProfile(userId);
    }
  };

  return {
    currentUser,
    allProfiles,
    allGroups,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    approveUser,
    rejectUser,
    createGroup,
    removeMemberFromGroup,
    fetchAllGroups,
    isLiveConfigured: isLiveSupabaseConfigured,
  };
}
