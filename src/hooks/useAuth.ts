import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole, UserStatus, Group } from '../lib/database.types';

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

    // Parse OAuth return parameters (errors or PKCE code)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const queryParams = url.searchParams;
      const hashString = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : '';
      const hashParams = new URLSearchParams(hashString);

      const oAuthErr = queryParams.get('error') || hashParams.get('error');
      const oAuthErrDesc =
        queryParams.get('error_description') ||
        hashParams.get('error_description') ||
        queryParams.get('error_code') ||
        '';

      if (oAuthErr) {
        console.error('OAuth sign-in error:', { error: oAuthErr, description: oAuthErrDesc });
        const descLower = oAuthErrDesc.toLowerCase();
        const errLower = oAuthErr.toLowerCase();

        if (
          descLower.includes('registration denied') ||
          descLower.includes('domain') ||
          descLower.includes('zewailcity') ||
          descLower.includes('database error saving new user') ||
          errLower.includes('server_error')
        ) {
          setError('Use your @zewailcity.edu.eg Google account');
        } else if (
          errLower.includes('access_denied') ||
          descLower.includes('cancel') ||
          descLower.includes('denied') ||
          descLower.includes('closed')
        ) {
          setError('Sign-in cancelled');
        } else {
          setError('Authentication failed. Please try again.');
        }

        // Clean auth error params from URL without page reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Initial fetch of groups and session
    fetchAllGroups();

    // 1. Check existing authenticated session
    supabase.auth.getSession().then(({ data: { session }, error: sessionErr }) => {
      if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
        // Strip PKCE code from URL once session resolution completes
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (sessionErr) {
        console.error('Session retrieval error:', sessionErr);
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

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

  // Sign In with Google OAuth (strictly domain-restricted to zewailcity.edu.eg)
  const signInWithGoogle = async () => {
    setError(null);
    if (!isLiveSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          hd: UNIVERSITY_DOMAIN,
          prompt: 'select_account',
        },
      },
    });

    if (oAuthErr) {
      setError(oAuthErr.message);
      throw oAuthErr;
    }
  };

  const clearError = () => setError(null);

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

  // Admin remove / unassign member from group (retains approved account status, clears group scope)
  const unassignMember = async (userId: string) => {
    if (!isLiveSupabaseConfigured) return;
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Club Administrators may manage sub-team rosters.');
    }

    if (currentUser?.id === userId) {
      throw new Error('Action Denied: You cannot unassign your own Administrator account.');
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        status: 'approved',
        role: 'pending',
        group_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // Optional audit log capture
    try {
      await supabase.from('activity_logs').insert({
        actor_id: currentUser.id,
        action: 'member_unassigned',
        entity_type: 'member',
        entity_id: userId,
        group_id: null,
        details: { action: 'Unassigned member from sub-team' }
      });
    } catch {
      // Table may not yet be created or accessible
    }

    await fetchAllProfiles();

    if (currentUser?.id === userId) {
      fetchProfile(userId);
    }
  };

  // Reassign member to another sub-team and/or change role
  const reassignMember = async (userId: string, targetGroupId: string | null, targetRole: UserRole) => {
    if (!isLiveSupabaseConfigured) return;
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Club Administrators may reassign team members.');
    }

    // Validation: if role is head or member, targetGroupId must not be null
    if ((targetRole === 'head' || targetRole === 'member') && !targetGroupId) {
      throw new Error('Cannot assign role "head" or "member" without a target sub-team.');
    }

    // Safety check: prevent demoting sole admin
    if (currentUser?.id === userId && targetRole !== 'admin') {
      throw new Error('Safety Guard: You cannot demote your own Administrator account.');
    }

    const updatePayload: Record<string, any> = {
      role: targetRole,
      group_id: targetGroupId,
      status: 'approved',
      updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (updateErr) throw updateErr;

    try {
      await supabase.from('activity_logs').insert({
        actor_id: currentUser.id,
        action: 'member_reassigned',
        entity_type: 'member',
        entity_id: userId,
        group_id: targetGroupId,
        details: { new_role: targetRole, new_group_id: targetGroupId }
      });
    } catch {
      // Table may not yet be created
    }

    await fetchAllProfiles();

    if (currentUser?.id === userId) {
      fetchProfile(userId);
    }
  };

  // Update account status (approved, pending, rejected)
  const updateUserStatus = async (userId: string, newStatus: UserStatus) => {
    if (!isLiveSupabaseConfigured) return;
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Club Administrators may update account statuses.');
    }

    if (currentUser?.id === userId && newStatus !== 'approved') {
      throw new Error('Safety Guard: You cannot deactivate or reject your own account.');
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    await fetchAllProfiles();
  };

  // Backward compatibility alias for removeMemberFromGroup
  const removeMemberFromGroup = unassignMember;

  return {
    currentUser,
    allProfiles,
    allGroups,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    clearError,
    approveUser,
    rejectUser,
    createGroup,
    removeMemberFromGroup,
    unassignMember,
    reassignMember,
    updateUserStatus,
    fetchAllGroups,
    fetchAllProfiles,
    isLiveConfigured: isLiveSupabaseConfigured,
  };
}
