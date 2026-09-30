import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured, isDemoMode } from '../lib/supabase';
import { 
  Task, 
  TaskSubmission, 
  TaskComment, 
  TaskStatus, 
  TaskPriority, 
  TaskType, 
  SubmissionType, 
  SubmissionReviewStatus,
  Profile 
} from '../lib/database.types';
import { 
  INITIAL_DEMO_TASKS, 
  INITIAL_DEMO_SUBMISSIONS, 
  INITIAL_DEMO_COMMENTS 
} from '../lib/demoData';

export function useTasks(currentUser: Profile | null) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!isDemoMode) return [];
    const saved = localStorage.getItem('zcfs_tasks');
    return saved ? JSON.parse(saved) : INITIAL_DEMO_TASKS;
  });

  const [submissions, setSubmissions] = useState<Record<string, TaskSubmission[]>>(() => {
    if (!isDemoMode) return {};
    const saved = localStorage.getItem('zcfs_submissions');
    return saved ? JSON.parse(saved) : (INITIAL_DEMO_SUBMISSIONS as Record<string, TaskSubmission[]>);
  });

  const [comments, setComments] = useState<Record<string, TaskComment[]>>(() => {
    if (!isDemoMode) return {};
    const saved = localStorage.getItem('zcfs_comments');
    return saved ? JSON.parse(saved) : (INITIAL_DEMO_COMMENTS as Record<string, TaskComment[]>);
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Sync to localStorage in demo mode
  useEffect(() => {
    if (!isLiveSupabaseConfigured && isDemoMode) {
      localStorage.setItem('zcfs_tasks', JSON.stringify(tasks));
      localStorage.setItem('zcfs_submissions', JSON.stringify(submissions));
      localStorage.setItem('zcfs_comments', JSON.stringify(comments));
    }
  }, [tasks, submissions, comments]);

  // Load Tasks, Submissions, Comments from Supabase
  const loadTasksFromSupabase = useCallback(async () => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;
    setLoading(true);
    try {
      // 1. Fetch Tasks & Assignees
      let taskQuery = supabase
        .from('tasks')
        .select(`
          *,
          creator:profiles!tasks_creator_id_fkey(*),
          assignees:task_assignees(
            id,
            status,
            user:profiles(*)
          )
        `)
        .order('deadline', { ascending: true });

      if (currentUser.role !== 'admin' && currentUser.group_id) {
        taskQuery = taskQuery.eq('group_id', currentUser.group_id);
      }

      const { data: taskData, error: taskErr } = await taskQuery;
      if (taskErr) throw taskErr;

      if (taskData) {
        const formatted: Task[] = taskData.map((t: any) => ({
          ...t,
          assignees: t.assignees?.map((a: any) => a.user).filter(Boolean) || [],
        }));
        setTasks(formatted);
      }

      // 2. Fetch Submissions (scoped by RLS)
      const { data: subData, error: subErr } = await supabase
        .from('task_submissions')
        .select('*, submitter:profiles!task_submissions_submitted_by_fkey(*)')
        .order('created_at', { ascending: false });

      if (!subErr && subData) {
        const subMap: Record<string, TaskSubmission[]> = {};
        subData.forEach((s: any) => {
          if (!subMap[s.task_id]) subMap[s.task_id] = [];
          subMap[s.task_id].push(s);
        });
        setSubmissions(subMap);
      }

      // 3. Fetch Comments (scoped by RLS)
      const { data: commData, error: commErr } = await supabase
        .from('task_comments')
        .select('*, author:profiles!task_comments_author_id_fkey(*)')
        .order('created_at', { ascending: true });

      if (!commErr && commData) {
        const commMap: Record<string, TaskComment[]> = {};
        commData.forEach((c: any) => {
          if (!commMap[c.task_id]) commMap[c.task_id] = [];
          commMap[c.task_id].push(c);
        });
        setComments(commMap);
      }
    } catch (err) {
      console.error('Error fetching tasks from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadTasksFromSupabase();
  }, [loadTasksFromSupabase]);

  // Realtime Postgres Changes Subscription
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    const channel = supabase
      .channel('public:tasks_telemetry')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasksFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, () => {
        loadTasksFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_submissions' }, () => {
        loadTasksFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, () => {
        loadTasksFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadTasksFromSupabase]);

  // Filter tasks visible to current user (enforcing RLS semantics in UI)
  const visibleTasks = tasks.filter((t) => {
    if (!currentUser || currentUser.status !== 'approved') return false;
    if (currentUser.role === 'admin') return true;
    return t.group_id === currentUser.group_id;
  });

  // Create Task (Head / Admin)
  const createTask = async (taskData: {
    title: string;
    description: string;
    groupId: string;
    taskType: TaskType;
    priority: TaskPriority;
    deadline: string;
    links: Array<{ title: string; url: string }>;
    assigneeIds: string[];
    assignees: Profile[];
  }) => {
    if (!currentUser) throw new Error('Must be logged in to create tasks.');

    if (!isLiveSupabaseConfigured) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        group_id: taskData.groupId,
        creator_id: currentUser.id,
        title: taskData.title,
        description: taskData.description,
        task_type: taskData.taskType,
        priority: taskData.priority,
        status: 'todo',
        deadline: taskData.deadline,
        links: taskData.links,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: currentUser,
        assignees: taskData.assignees,
      };
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    }

    // Insert task to Supabase
    const { data: createdTask, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        group_id: taskData.groupId,
        creator_id: currentUser.id,
        title: taskData.title,
        description: taskData.description,
        task_type: taskData.taskType,
        priority: taskData.priority,
        status: 'todo',
        deadline: taskData.deadline,
        links: taskData.links,
      })
      .select()
      .single();

    if (taskErr) throw taskErr;

    // Insert assignees into junction table
    if (taskData.assigneeIds.length > 0 && createdTask) {
      const assigneeRows = taskData.assigneeIds.map((userId) => ({
        task_id: createdTask.id,
        user_id: userId,
        status: 'assigned',
      }));

      const { error: assignErr } = await supabase
        .from('task_assignees')
        .insert(assigneeRows);

      if (assignErr) console.warn('Assignees insert warning:', assignErr.message);
    }

    await loadTasksFromSupabase();
    return createdTask;
  };

  // Update Task Status
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!currentUser) return;

    if (!isLiveSupabaseConfigured) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        )
      );
      return;
    }

    // If assignee, update task_assignees status to trigger sync_task_status_from_assignees
    const { data: assigneeMatch } = await supabase
      .from('task_assignees')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (assigneeMatch && ['assigned', 'in_progress', 'submitted', 'changes_requested', 'approved'].includes(newStatus)) {
      await supabase
        .from('task_assignees')
        .update({ 
          status: newStatus as any, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', assigneeMatch.id);
    }

    // Also update tasks directly for admin/heads or direct status overrides
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) console.warn('Direct task status update note:', error.message);
    await loadTasksFromSupabase();
  };

  // Submit Work (Member)
  const submitWork = async (
    taskId: string,
    submissionType: SubmissionType,
    content: string,
    notes: string
  ) => {
    if (!currentUser) throw new Error('Must be logged in to submit work.');

    const currentSubmissions = submissions[taskId] || [];
    const nextVersion = currentSubmissions.length + 1;

    if (!isLiveSupabaseConfigured) {
      const newSub: TaskSubmission = {
        id: `sub-${Date.now()}`,
        task_id: taskId,
        submitted_by: currentUser.id,
        version_number: nextVersion,
        submission_type: submissionType,
        content,
        notes,
        review_status: 'pending',
        review_feedback: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        submitter: currentUser,
      };

      setSubmissions((prev) => ({
        ...prev,
        [taskId]: [newSub, ...(prev[taskId] || [])],
      }));
      updateTaskStatus(taskId, 'submitted');
      return newSub;
    }

    // Insert into task_submissions
    const { data, error } = await supabase
      .from('task_submissions')
      .insert({
        task_id: taskId,
        submitted_by: currentUser.id,
        version_number: nextVersion,
        submission_type: submissionType,
        content,
        notes,
        review_status: 'pending',
      })
      .select('*, submitter:profiles!task_submissions_submitted_by_fkey(*)')
      .single();

    if (error) throw error;

    // Update user's assignee status to submitted (triggers automatic task status rollup)
    await supabase
      .from('task_assignees')
      .update({ status: 'submitted', updated_at: new Date().toISOString() })
      .eq('task_id', taskId)
      .eq('user_id', currentUser.id);

    await loadTasksFromSupabase();
    return data;
  };

  // Review Submission (Head / Admin)
  const reviewSubmission = async (
    submissionId: string,
    taskId: string,
    reviewStatus: SubmissionReviewStatus,
    feedback: string
  ) => {
    if (!currentUser) throw new Error('Must be logged in to review.');

    const targetAssigneeStatus = reviewStatus === 'approved' ? 'approved' : 'changes_requested';

    if (!isLiveSupabaseConfigured) {
      setSubmissions((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).map((s) =>
          s.id === submissionId
            ? {
                ...s,
                review_status: reviewStatus,
                review_feedback: feedback,
                reviewed_by: currentUser.id,
                reviewed_at: new Date().toISOString(),
              }
            : s
        ),
      }));

      updateTaskStatus(taskId, targetAssigneeStatus);
      return;
    }

    const { error: reviewErr } = await supabase
      .from('task_submissions')
      .update({
        review_status: reviewStatus,
        review_feedback: feedback,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (reviewErr) throw reviewErr;

    // Find submission author and update their task_assignee status
    const { data: subRow } = await supabase
      .from('task_submissions')
      .select('submitted_by')
      .eq('id', submissionId)
      .single();

    if (subRow?.submitted_by) {
      await supabase
        .from('task_assignees')
        .update({ 
          status: targetAssigneeStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('task_id', taskId)
        .eq('user_id', subRow.submitted_by);
    }

    await loadTasksFromSupabase();
  };

  // Add Comment to Task Discussion Thread
  const addComment = async (taskId: string, content: string) => {
    if (!currentUser) throw new Error('Must be logged in to comment.');

    if (!isLiveSupabaseConfigured) {
      const newComment: TaskComment = {
        id: `comm-${Date.now()}`,
        task_id: taskId,
        author_id: currentUser.id,
        content,
        attachment_url: null,
        created_at: new Date().toISOString(),
        author: currentUser,
      };

      setComments((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), newComment],
      }));
      return newComment;
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        author_id: currentUser.id,
        content,
      })
      .select('*, author:profiles!task_comments_author_id_fkey(*)')
      .single();

    if (error) throw error;
    await loadTasksFromSupabase();
    return data;
  };

  return {
    tasks: visibleTasks,
    allTasks: tasks,
    submissions,
    comments,
    loading,
    createTask,
    updateTaskStatus,
    submitWork,
    reviewSubmission,
    addComment,
    reloadTasks: loadTasksFromSupabase,
  };
}
