import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
import { ActivityLog, ActivityAction, ActivityEntityType, Profile, Task, TaskSubmission } from '../lib/database.types';

export function useActivityLog(
  currentUser: Profile | null,
  tasks: Task[] = [],
  submissions: Record<string, TaskSubmission[]> = {}
) {
  const [dbLogs, setDbLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Load activity logs from Supabase
  const fetchLogs = useCallback(async () => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;
    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          actor:profiles!activity_logs_actor_id_fkey(*),
          group:groups!activity_logs_group_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Non-admins see their own sub-team or club-wide logs (enforced by RLS)
      if (currentUser.role !== 'admin' && currentUser.group_id) {
        query = query.or(`group_id.eq.${currentUser.group_id},group_id.is.null`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setDbLogs(data as ActivityLog[]);
      }
    } catch {
      // Table may not yet be created remotely
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime subscription to activity_logs
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    const channel = supabase
      .channel('activity_stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchLogs]);

  // Synthesize events if dbLogs is empty (guarantees NO fake data; uses actual task states)
  const synthesizedLogs = useMemo<ActivityLog[]>(() => {
    const list: ActivityLog[] = [];

    // Synthesize from tasks
    tasks.forEach((task) => {
      list.push({
        id: `synth-task-${task.id}`,
        actor_id: task.creator_id,
        action: 'task_created',
        entity_type: 'task',
        entity_id: task.id,
        group_id: task.group_id,
        details: {
          title: task.title,
          priority: task.priority,
          status: task.status,
        },
        created_at: task.created_at,
        actor: task.creator,
      });

      if (task.status === 'approved' || task.status === 'done') {
        list.push({
          id: `synth-done-${task.id}`,
          actor_id: task.creator_id,
          action: 'task_status_changed',
          entity_type: 'task',
          entity_id: task.id,
          group_id: task.group_id,
          details: {
            title: task.title,
            new_status: task.status,
          },
          created_at: task.updated_at,
          actor: task.creator,
        });
      }
    });

    // Synthesize from submissions
    Object.values(submissions).forEach((subList) => {
      subList.forEach((sub) => {
        list.push({
          id: `synth-sub-${sub.id}`,
          actor_id: sub.submitted_by,
          action: 'submission_created',
          entity_type: 'submission',
          entity_id: sub.id,
          group_id: null,
          details: {
            version: `v${sub.version_number}`,
            type: sub.submission_type,
            notes: sub.notes,
          },
          created_at: sub.created_at,
          actor: sub.submitter,
        });

        if (sub.review_status !== 'pending' && sub.reviewed_at) {
          list.push({
            id: `synth-rev-${sub.id}`,
            actor_id: sub.reviewed_by,
            action: 'submission_reviewed',
            entity_type: 'submission',
            entity_id: sub.id,
            group_id: null,
            details: {
              version: `v${sub.version_number}`,
              review_status: sub.review_status,
              feedback: sub.review_feedback,
            },
            created_at: sub.reviewed_at,
          });
        }
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tasks, submissions]);

  // Combined logs: prefer live dbLogs if available, otherwise synthesized real events
  const logs = useMemo(() => {
    if (dbLogs.length > 0) return dbLogs;
    return synthesizedLogs;
  }, [dbLogs, synthesizedLogs]);

  // Record an activity log
  const logActivity = async (
    action: ActivityAction,
    entityType: ActivityEntityType,
    entityId: string,
    groupId: string | null = null,
    details: Record<string, any> = {}
  ) => {
    if (!currentUser) return;
    try {
      await supabase.from('activity_logs').insert({
        actor_id: currentUser.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        group_id: groupId,
        details,
      });
      fetchLogs();
    } catch {
      // Ignored if table not migrated yet
    }
  };

  return {
    logs,
    loading,
    logActivity,
    refresh: fetchLogs,
  };
}
