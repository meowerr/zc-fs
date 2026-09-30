import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
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
  isDemoMode, 
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
    if (!isLiveSupabaseConfigured) {
      localStorage.setItem('zcfs_tasks', JSON.stringify(tasks));
      localStorage.setItem('zcfs_submissions', JSON.stringify(submissions));
      localStorage.setItem('zcfs_comments', JSON.stringify(comments));
    }
  }, [tasks, submissions, comments]);

  // Load from Supabase if configured
  const loadTasksFromSupabase = useCallback(async () => {
    if (!isLiveSupabaseConfigured || !currentUser) return;
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignees:task_assignees(user:profiles(*))
        `)
        .order('deadline', { ascending: true });

      // If not admin, RLS automatically handles it, but we can also filter by group
      if (currentUser.role !== 'admin' && currentUser.group_id) {
        query = query.eq('group_id', currentUser.group_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        // Transform assignees
        const formatted = data.map((t: any) => ({
          ...t,
          assignees: t.assignees?.map((a: any) => a.user) || []
        }));
        setTasks(formatted);
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

    if (!isLiveSupabaseConfigured) {
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    }

    // Insert to Supabase
    const { data, error } = await supabase
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

    if (error) throw error;

    // Insert assignees
    if (taskData.assigneeIds.length > 0 && data) {
      await supabase.from('task_assignees').insert(
        taskData.assigneeIds.map((userId) => ({
          task_id: data.id,
          user_id: userId,
        }))
      );
    }

    await loadTasksFromSupabase();
    return data;
  };

  // Update Task Status
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!isLiveSupabaseConfigured) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        )
      );
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;
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

    if (!isLiveSupabaseConfigured) {
      setSubmissions((prev) => ({
        ...prev,
        [taskId]: [newSub, ...(prev[taskId] || [])],
      }));
      // Move task to 'submitted'
      updateTaskStatus(taskId, 'submitted');
      return newSub;
    }

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
      .select()
      .single();

    if (error) throw error;

    await updateTaskStatus(taskId, 'submitted');
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

    const targetTaskStatus: TaskStatus = reviewStatus === 'approved' ? 'approved' : 'changes_requested';

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

      updateTaskStatus(taskId, targetTaskStatus);
      return;
    }

    const { error } = await supabase
      .from('task_submissions')
      .update({
        review_status: reviewStatus,
        review_feedback: feedback,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) throw error;

    await updateTaskStatus(taskId, targetTaskStatus);
  };

  // Add Comment to Task Discussion Thread
  const addComment = async (taskId: string, content: string) => {
    if (!currentUser) throw new Error('Must be logged in to comment.');

    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      task_id: taskId,
      author_id: currentUser.id,
      content,
      attachment_url: null,
      created_at: new Date().toISOString(),
      author: currentUser,
    };

    if (!isLiveSupabaseConfigured) {
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
      .select()
      .single();

    if (error) throw error;
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
