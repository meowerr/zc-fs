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

// Realistic initial Formula Student tasks
const INITIAL_DEMO_TASKS: Task[] = [
  {
    id: 'task-101',
    group_id: '11111111-1111-1111-1111-111111111111', // Vehicle Dynamics
    creator_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Kareem (Head)
    title: 'Double Wishbone Suspension Kinematics Simulation',
    description: 'Perform bump steer, roll center migration, and camber recovery simulation in Lotus Shark. Validate with tire envelope.',
    task_type: 'design',
    priority: 'high',
    status: 'in_progress',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    links: [{ title: 'Lotus Shark Model CAD', url: 'https://cad.onshape.com/sample-suspension' }],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        email: 'omar.member@zewailcity.edu.eg',
        full_name: 'Omar Sherif',
        avatar_url: null,
        phone: null,
        role: 'member',
        group_id: '11111111-1111-1111-1111-111111111111',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
  },
  {
    id: 'task-102',
    group_id: '11111111-1111-1111-1111-111111111111', // Vehicle Dynamics
    creator_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: 'Brake Caliper Bracket FEA Stress Analysis',
    description: 'Run ANSYS structural analysis under 1.8G maximum deceleration. Target factor of safety: 2.2 on 7075-T6 aluminum.',
    task_type: 'report',
    priority: 'urgent',
    status: 'submitted',
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    links: [{ title: 'Ansys Project Repo', url: 'https://github.com/zcfs/brake-fea' }],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        email: 'omar.member@zewailcity.edu.eg',
        full_name: 'Omar Sherif',
        avatar_url: null,
        phone: null,
        role: 'member',
        group_id: '11111111-1111-1111-1111-111111111111',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
  },
  {
    id: 'task-201',
    group_id: '22222222-2222-2222-2222-222222222222', // Aerodynamics
    creator_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Front Wing Multi-Element Airfoil Mesh',
    description: 'Generate polyhedral mesh with 15 prism layers for Y+ < 1 boundary layer resolution.',
    task_type: 'code',
    priority: 'high',
    status: 'changes_requested',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
    links: [{ title: 'CFD Setup Docs', url: 'https://openfoam.org' }],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
  },
  {
    id: 'task-301',
    group_id: '33333333-3333-3333-3333-333333333333', // Electronics
    creator_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'CAN Bus Dashboard Packet Decoder Node',
    description: 'Implement C++ firmware for STM32 to decode RPM, wheel speeds, and brake pressure.',
    task_type: 'code',
    priority: 'medium',
    status: 'approved',
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    links: [{ title: 'Firmware GitHub Repo', url: 'https://github.com/zcfs/can-telemetry' }],
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
  }
];

const INITIAL_DEMO_SUBMISSIONS: Record<string, TaskSubmission[]> = {
  'task-102': [
    {
      id: 'sub-01',
      task_id: 'task-102',
      submitted_by: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      version_number: 1,
      submission_type: 'link',
      content: 'https://github.com/zcfs/brake-fea/pull/12',
      notes: 'Completed mesh convergence study and static stress analysis. Max von Mises stress is 214 MPa.',
      review_status: 'pending',
      review_feedback: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      submitter: {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        email: 'omar.member@zewailcity.edu.eg',
        full_name: 'Omar Sherif',
        avatar_url: null,
        phone: null,
        role: 'member',
        group_id: '11111111-1111-1111-1111-111111111111',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  ],
  'task-201': [
    {
      id: 'sub-02',
      task_id: 'task-201',
      submitted_by: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      version_number: 1,
      submission_type: 'link',
      content: 'https://github.com/zcfs/aero-cfd/commits/mesh-v1',
      notes: 'Initial polyhedral mesh generated.',
      review_status: 'changes_requested',
      review_feedback: 'Trailing edge prism layers collapsed. Please refine aspect ratio around the flap gurney.',
      reviewed_by: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      reviewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }
  ]
};

const INITIAL_DEMO_COMMENTS: Record<string, TaskComment[]> = {
  'task-101': [
    {
      id: 'comm-01',
      task_id: 'task-101',
      author_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      content: 'Make sure you verify clearance with the upright steering arm in full bump!',
      attachment_url: null,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      author: {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        email: 'kareem.vd@zewailcity.edu.eg',
        full_name: 'Kareem Tarek (Head)',
        avatar_url: null,
        phone: null,
        role: 'head',
        group_id: '11111111-1111-1111-1111-111111111111',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    {
      id: 'comm-02',
      task_id: 'task-101',
      author_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      content: 'Understood. Kinematics model has 15mm clearance in full jounce.',
      attachment_url: null,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      author: {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        email: 'omar.member@zewailcity.edu.eg',
        full_name: 'Omar Sherif',
        avatar_url: null,
        phone: null,
        role: 'member',
        group_id: '11111111-1111-1111-1111-111111111111',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  ]
};

export function useTasks(currentUser: Profile | null) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('zcfs_tasks');
    return saved ? JSON.parse(saved) : INITIAL_DEMO_TASKS;
  });

  const [submissions, setSubmissions] = useState<Record<string, TaskSubmission[]>>(() => {
    const saved = localStorage.getItem('zcfs_submissions');
    return saved ? JSON.parse(saved) : INITIAL_DEMO_SUBMISSIONS;
  });

  const [comments, setComments] = useState<Record<string, TaskComment[]>>(() => {
    const saved = localStorage.getItem('zcfs_comments');
    return saved ? JSON.parse(saved) : INITIAL_DEMO_COMMENTS;
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
