export type UserRole = 'admin' | 'head' | 'member' | 'pending';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'read' | 'code' | 'design' | 'report' | 'research' | 'other';
export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'changes_requested' | 'approved' | 'done';
export type AssigneeTaskStatus = 'assigned' | 'in_progress' | 'submitted' | 'changes_requested' | 'approved';
export type SubmissionType = 'file' | 'link' | 'note';
export type SubmissionReviewStatus = 'pending' | 'approved' | 'changes_requested';
export type ChannelType = 'group' | 'heads_only' | 'announcements';
export type NotificationType = 
  | 'task_assigned' 
  | 'task_due_soon' 
  | 'submission_received' 
  | 'review_result' 
  | 'mention' 
  | 'announcement';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color_accent: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  group_id: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  group_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  links: Array<{ title: string; url: string }>;
  created_at: string;
  updated_at: string;
  // Joined fields
  group?: Group;
  creator?: Profile;
  assignees?: Profile[];
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  status: AssigneeTaskStatus;
  assigned_at: string;
  updated_at: string;
  user?: Profile;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  submitted_by: string;
  version_number: number;
  submission_type: SubmissionType;
  content: string;
  notes: string | null;
  review_status: SubmissionReviewStatus;
  review_feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  submitter?: Profile;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
  author?: Profile;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  channel_type: ChannelType;
  group_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  other_participant?: Profile;
}

export interface Message {
  id: string;
  channel_id: string | null;
  conversation_id: string | null;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  created_at: string;
  sender?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
