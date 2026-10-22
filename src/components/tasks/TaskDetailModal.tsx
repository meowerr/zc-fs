import React, { useState, useMemo } from 'react';
import { 
  X, 
  Clock, 
  ExternalLink, 
  Send, 
  MessageSquare, 
  History, 
  Sparkles,
  Link as LinkIcon,
  Trash2,
  AlertTriangle,
  GitCommit
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { parseUserIdentity } from '../common/UserLabel';
import { GlowInput } from '../common/GlowInput';
import { safeHref } from '../../lib/constants';
import { 
  Task, 
  TaskSubmission, 
  TaskComment, 
  TaskStatus, 
  SubmissionType, 
  SubmissionReviewStatus, 
  Profile 
} from '../../lib/database.types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  submissions: TaskSubmission[];
  comments: TaskComment[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onSubmitWork: (taskId: string, type: SubmissionType, content: string, notes: string) => Promise<void>;
  onReviewSubmission: (submissionId: string, taskId: string, status: SubmissionReviewStatus, feedback: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  currentUser,
  submissions,
  comments,
  onUpdateStatus,
  onSubmitWork,
  onReviewSubmission,
  onAddComment,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'discussion' | 'timeline'>('overview');

  // Timeline events calculation (Objective 6: Task Timeline / History)
  const timelineEvents = useMemo(() => {
    if (!task) return [];
    const list: Array<{
      id: string;
      type: 'created' | 'assignment' | 'submission' | 'review' | 'comment';
      title: string;
      actor: string;
      timestamp: string;
      details?: string;
      color: string;
      badgeText: string;
    }> = [];

    // 1. Task Dispatched
    list.push({
      id: `created-${task.id}`,
      type: 'created',
      title: 'Task Dispatched',
      actor: task.creator?.full_name || 'Sub-Team Lead / Admin',
      timestamp: task.created_at,
      details: `Dispatched with priority ${(task.priority || 'medium').toUpperCase()} and type ${(task.task_type || 'task').toUpperCase()}`,
      color: '#00D9FF',
      badgeText: 'CREATED',
    });

    // 2. Assignees Allocated
    if (task.assignees && task.assignees.length > 0) {
      list.push({
        id: `assignees-${task.id}`,
        type: 'assignment',
        title: 'Engineers Allocated',
        actor: task.assignees.map((a) => a.full_name).join(', '),
        timestamp: task.created_at,
        details: `${task.assignees.length} engineer(s) allocated to deliverable`,
        color: '#2F6BFF',
        badgeText: 'ASSIGNED',
      });
    }

    // 3. Submissions & Reviews
    submissions.forEach((sub) => {
      list.push({
        id: `sub-${sub.id}`,
        type: 'submission',
        title: `Work Deliverable v${sub.version_number} (${sub.submission_type.toUpperCase()})`,
        actor: sub.submitter?.full_name || 'Engineer',
        timestamp: sub.created_at,
        details: sub.notes ? `"${sub.notes}"` : `Content: ${sub.content}`,
        color: '#A855F7',
        badgeText: `REV v${sub.version_number}`,
      });

      if (sub.review_status !== 'pending') {
        const isApproved = sub.review_status === 'approved';
        list.push({
          id: `rev-${sub.id}`,
          type: 'review',
          title: `Deliverable v${sub.version_number} Review`,
          actor: sub.reviewer?.full_name || (sub.reviewed_by ? 'Reviewer' : 'Group Head'),
          timestamp: sub.reviewed_at || sub.created_at,
          details: sub.review_feedback
            ? `Feedback: "${sub.review_feedback}"`
            : (isApproved ? 'Approved without revisions' : 'Changes requested by review lead'),
          color: isApproved ? '#10E57A' : '#FF304F',
          badgeText: isApproved ? 'APPROVED' : 'CHANGES REQ',
        });
      }
    });

    // 4. Comments
    comments.forEach((c) => {
      list.push({
        id: `comm-${c.id}`,
        type: 'comment',
        title: 'Telemetry Discussion Note',
        actor: c.author?.full_name || 'Team Member',
        timestamp: c.created_at,
        details: c.content,
        color: '#B0B8C2',
        badgeText: 'NOTE',
      });
    });

    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [task, submissions, comments]);

  const getDeltaTime = (eventTime: string, startTime: string) => {
    const diffMs = new Date(eventTime).getTime() - new Date(startTime).getTime();
    if (diffMs <= 0) return 'T+00h 00m';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `T+${days}d ${remHours}h`;
    }
    return `T+${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  };
  
  // Delete task state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Submit work state
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [subType, setSubType] = useState<SubmissionType>('link');
  const [subContent, setSubContent] = useState('');
  const [subNotes, setSubNotes] = useState('');
  const [subError, setSubError] = useState<string | null>(null);

  // Review state
  const [reviewingSubId, setReviewingSubId] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const commentEndRef = React.useRef<HTMLDivElement>(null);
  const mouseDownTargetRef = React.useRef<EventTarget | null>(null);

  // Multi-assignee approval statistics
  const assigneeStats = useMemo(() => {
    if (!task?.assignees || task.assignees.length <= 1) return null;
    const details = task.assigneeDetails || [];
    const approved = details.filter((d) => d.status === 'approved').length;
    return {
      total: task.assignees.length,
      approved,
      isFullyApproved: approved === task.assignees.length,
    };
  }, [task?.assignees, task?.assigneeDetails]);

  React.useEffect(() => {
    if (activeTab === 'discussion') {
      commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length, activeTab]);

  // Unified submission action lock
  const [submittingAction, setSubmittingAction] = useState<'work' | 'review' | 'comment' | null>(null);

  React.useEffect(() => {
    if (!isOpen || !task) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, task, onClose]);

  if (!isOpen || !task) return null;

  const isHeadOrAdmin = currentUser.role === 'admin' || (currentUser.role === 'head' && currentUser.group_id === task.group_id);
  const isAssignee = task.assignees?.some((a) => a.id === currentUser.id) || false;

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);
    if (!subContent.trim()) {
      setSubError('Deliverable link or content is required.');
      return;
    }
    if (subType === 'link' && !safeHref(subContent.trim())) {
      setSubError('Please enter a valid HTTP or HTTPS deliverable URL.');
      return;
    }
    if (submittingAction) return;

    setSubmittingAction('work');
    try {
      await onSubmitWork(task.id, subType, subContent.trim(), subNotes.trim());
      setIsSubmittingWork(false);
      setSubContent('');
      setSubNotes('');
      setActiveTab('submissions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setSubError(msg);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleReviewSubmit = async (subId: string, status: SubmissionReviewStatus) => {
    if (submittingAction) return;
    setSubmittingAction('review');
    setReviewError(null);
    try {
      await onReviewSubmission(subId, task.id, status, reviewFeedback.trim());
      setReviewingSubId(null);
      setReviewFeedback('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Review submission failed';
      setReviewError(msg);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingAction) return;
    setSubmittingAction('comment');
    setCommentError(null);
    try {
      await onAddComment(task.id, newComment.trim());
      setNewComment('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post reply';
      setCommentError(msg);
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 border border-cyber-border-strong shadow-cyber-elevated overflow-hidden bg-cyber-surface">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-cyber-border flex-shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-medium text-accent-cyan">
                {task.id.slice(0, 8)}
              </span>
              <span className="px-1.5 py-0.5 rounded text-label font-mono uppercase bg-cyber-bg-alt border border-cyber-border text-cyber-secondary font-medium">
                {task.task_type}
              </span>
              <LedStatusChip status={task.priority} size="sm" />
            </div>

            <h3 className="font-sans font-bold text-base sm:text-lg text-cyber-primary leading-snug">
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <LedStatusChip status={task.status} />
            {isHeadOrAdmin && onDeleteTask && (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="p-1 px-2.5 rounded text-accent-red hover:bg-accent-red/10 border border-accent-red/30 transition-all flex items-center gap-1.5 text-xs font-mono font-medium cursor-pointer"
                title="Delete Deliverable"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close deliverable details"
              title="Close"
              className="tap-target rounded-lg flex items-center justify-center hover:bg-cyber-surface-hover transition-colors text-cyber-muted hover:text-cyber-primary border border-transparent hover:border-cyber-border cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          className="flex items-center gap-1 my-2 p-1 rounded-lg bg-cyber-bg-alt border border-cyber-border shrink-0 sticky top-0 z-10 overflow-x-auto no-scrollbar"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[70px] min-h-[40px] py-2 px-2.5 rounded text-label font-mono font-medium uppercase transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-cyber-surface-elevated text-accent-cyan border border-cyber-border shadow-cyber-sm'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            Overview
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'submissions'}
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 min-w-[85px] min-h-[40px] py-2 px-2.5 rounded text-label font-mono font-medium uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'bg-cyber-surface-elevated text-accent-cyan border border-cyber-border shadow-cyber-sm'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            <History className="w-3.5 h-3.5 hidden sm:inline" />
            Submissions ({submissions.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'discussion'}
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 min-w-[75px] min-h-[40px] py-2 px-2.5 rounded text-label font-mono font-medium uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'discussion'
                ? 'bg-cyber-surface-elevated text-accent-cyan border border-cyber-border shadow-cyber-sm'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 hidden sm:inline" />
            Thread ({comments.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 min-w-[75px] min-h-[40px] py-2 px-2.5 rounded text-label font-mono font-medium uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-cyber-surface-elevated text-accent-cyan border border-cyber-border shadow-cyber-sm'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 hidden sm:inline" />
            Timeline ({timelineEvents.length})
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Description */}
              <div className="p-4 rounded-xl bg-cyber-surface border border-cyber-border space-y-1">
                <div className="text-label font-mono text-cyber-muted uppercase tracking-wider">
                  Technical Specifications & Objectives
                </div>
                <p className="text-sm text-cyber-primary leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </p>
              </div>

              {/* Deadline & Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-cyber-surface border border-cyber-border">
                  <div className="text-label font-mono text-cyber-muted uppercase">
                    Deadline Target
                  </div>
                  <div className="text-xs font-mono font-medium text-accent-yellow flex items-center gap-1.5 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(task.deadline).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyber-surface border border-cyber-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-label font-mono text-cyber-muted uppercase">
                      Assigned Engineers
                    </div>
                    {assigneeStats && (
                      <span className="text-label font-mono px-2 py-0.5 rounded bg-cyber-bg-alt border border-cyber-border text-cyber-secondary font-medium">
                        {assigneeStats.approved}/{assigneeStats.total} APPROVED
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {task.assignees && task.assignees.length > 0 ? (
                      task.assignees.map((a) => {
                        const { displayName, studentId } = parseUserIdentity(a.full_name, a.email);
                        const detail = task.assigneeDetails?.find((d) => d.user_id === a.id);
                        return (
                          <div key={a.id} className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-cyber-bg border border-cyber-border text-xs font-semibold text-cyber-primary">
                            <ChromeAvatar name={displayName} role={a.role} size="sm" />
                            <span className="truncate max-w-[120px]">{displayName}</span>
                            {studentId && <span className="text-label font-mono text-cyber-muted">#{studentId}</span>}
                            {detail?.status && (
                              <span className={`text-label font-mono uppercase px-1.5 py-0.5 rounded border ${
                                detail.status === 'approved'
                                  ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime'
                                  : detail.status === 'submitted'
                                  ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                                  : 'bg-cyber-surface border-cyber-border text-cyber-muted'
                              }`}>
                                {detail.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-cyber-muted italic font-mono">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Links */}
              {task.links && task.links.length > 0 && (
                <div className="space-y-2">
                  <div className="text-label font-mono font-medium text-cyber-secondary uppercase">
                    Attached CAD / Document References
                  </div>
                  <div className="space-y-1.5">
                    {task.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={safeHref(link.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-cyber-surface border border-cyber-border hover:border-accent-cyan/60 transition-all text-xs font-mono group"
                      >
                        <span className="flex items-center gap-2 text-cyber-primary font-medium">
                          <LinkIcon className="w-3.5 h-3.5 text-accent-cyan" />
                          {link.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-cyber-muted group-hover:text-accent-cyan transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Status Action Bar */}
              <div className="pt-3 border-t border-cyber-border flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-mono text-cyber-muted">
                  Update Lifecycle State:
                </div>

                <div className="flex items-center gap-2">
                  {task.status === 'todo' && (isAssignee || isHeadOrAdmin) && (
                    <GlossyButton
                      size="sm"
                      variant="primary"
                      onClick={() => onUpdateStatus(task.id, 'in_progress')}
                    >
                      Start Task
                    </GlossyButton>
                  )}

                  {/* If assigned or head, show Submit Work Button */}
                  {(isAssignee || isHeadOrAdmin) && (
                    <GlossyButton
                      size="sm"
                      variant="action"
                      onClick={() => {
                        setIsSubmittingWork(true);
                        setActiveTab('submissions');
                      }}
                    >
                      Submit Work Deliverable
                    </GlossyButton>
                  )}

                  {isHeadOrAdmin && task.status === 'approved' && (
                    <GlossyButton
                      size="sm"
                      variant="action"
                      onClick={() => onUpdateStatus(task.id, 'done')}
                    >
                      Mark Done
                    </GlossyButton>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBMISSIONS & REVISIONS */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {/* Member Work Submission Form */}
              {isSubmittingWork ? (
                <GlassCard variant="elevated" className="p-4 space-y-3 border-cyber-border-strong bg-cyber-surface">
                  <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-accent-cyan">
                      Submit Work Deliverable (v{submissions.length + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSubmittingWork(false)}
                      className="text-xs text-cyber-muted hover:text-cyber-primary hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  {subError && (
                    <div className="p-2 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
                      {subError}
                    </div>
                  )}

                  <form onSubmit={handleWorkSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['link', 'note', 'file'] as SubmissionType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSubType(t)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-medium uppercase transition-all cursor-pointer border ${
                            subType === t
                              ? 'bg-accent-cyan text-black border-accent-cyan shadow-sm'
                              : 'bg-cyber-surface text-cyber-secondary border-cyber-border hover:text-cyber-primary'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <GlowInput
                      label={subType === 'link' ? 'Deliverable URL (GitHub / Onshape / Google Drive)' : 'Deliverable Note or File Path'}
                      placeholder={subType === 'link' ? 'https://github.com/zcfs/...' : 'Describe delivery or link...'}
                      value={subContent}
                      onChange={(e) => setSubContent(e.target.value)}
                      required
                    />

                    <div>
                      <label className="block text-label font-mono uppercase text-cyber-secondary mb-1">
                        Revision Notes for Reviewer
                      </label>
                      <textarea
                        rows={2}
                        value={subNotes}
                        onChange={(e) => setSubNotes(e.target.value)}
                        placeholder="Detail changes made, simulation parameters, or notes for the Sub-team Head..."
                        className="w-full p-2.5 rounded-xl text-xs bg-cyber-surface border border-cyber-border focus:outline-none focus:border-accent-cyan text-cyber-primary placeholder:text-cyber-muted font-sans"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <GhostButton size="sm" type="button" onClick={() => setIsSubmittingWork(false)} disabled={submittingAction === 'work'}>
                        Cancel
                      </GhostButton>
                      <GlossyButton size="sm" variant="primary" type="submit" disabled={submittingAction === 'work' || !subContent.trim()}>
                        {submittingAction === 'work' ? 'Submitting...' : 'Confirm Submission'}
                      </GlossyButton>
                    </div>
                  </form>
                </GlassCard>
              ) : (
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono text-cyber-muted block">
                      Submission History & Review Records
                    </span>
                    {assigneeStats && (
                      <span className="text-label font-mono text-cyber-secondary">
                        Multi-engineer deliverable: {assigneeStats.approved} of {assigneeStats.total} approved
                      </span>
                    )}
                  </div>
                  {(isAssignee || isHeadOrAdmin) && (
                    <GlossyButton size="sm" variant="primary" onClick={() => setIsSubmittingWork(true)}>
                      + New Submission
                    </GlossyButton>
                  )}
                </div>
              )}

              {/* Submissions List */}
              {submissions.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-cyber-muted italic">
                  No deliverables submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-cyber-surface border border-cyber-border space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium px-2 py-0.5 rounded bg-cyber-surface-hover text-accent-cyan border border-cyber-border text-label">
                            REV v{sub.version_number}
                          </span>
                          <span className="text-cyber-muted font-mono text-label">
                            {new Date(sub.created_at).toLocaleString()}
                          </span>
                        </div>

                        <LedStatusChip status={sub.review_status} size="sm" />
                      </div>

                      <div className="text-xs font-sans">
                        <span className="font-bold text-cyber-primary">Content: </span>
                        {sub.submission_type === 'link' ? (
                          <a
                            href={safeHref(sub.content)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-cyan hover:underline inline-flex items-center gap-1 font-mono"
                          >
                            {sub.content} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="font-mono text-cyber-secondary">{sub.content}</span>
                        )}
                      </div>

                      {sub.notes && (
                        <div className="text-xs text-cyber-secondary bg-cyber-surface-hover p-2 rounded-lg border border-cyber-border/40">
                          <span className="font-semibold text-cyber-primary">Notes: </span>
                          {sub.notes}
                        </div>
                      )}

                      {/* Review Feedback if present */}
                      {sub.review_feedback && (
                        <div className="p-2.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-xs space-y-1">
                          <div className="font-mono font-medium text-accent-cyan flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Reviewer Feedback:
                          </div>
                          <p className="text-cyber-secondary">{sub.review_feedback}</p>
                        </div>
                      )}

                      {/* Head Review Action Box */}
                      {isHeadOrAdmin && sub.review_status === 'pending' && (
                        <div className="pt-2 border-t border-cyber-border">
                          {reviewingSubId === sub.id ? (
                            <div className="space-y-2">
                              {reviewError && (
                                <div className="p-2 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
                                  {reviewError}
                                </div>
                              )}
                              <textarea
                                rows={2}
                                value={reviewFeedback}
                                onChange={(e) => setReviewFeedback(e.target.value)}
                                placeholder="Enter constructive feedback or change requests..."
                                className="w-full p-2 text-xs rounded-lg bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan"
                              />
                              <div className="flex justify-end gap-2">
                                <GhostButton size="sm" onClick={() => { setReviewingSubId(null); setReviewError(null); }} disabled={submittingAction === 'review'}>
                                  Cancel
                                </GhostButton>
                                <GlossyButton
                                  size="sm"
                                  variant="warning"
                                  disabled={submittingAction === 'review'}
                                  onClick={() => handleReviewSubmit(sub.id, 'changes_requested')}
                                >
                                  {submittingAction === 'review' ? 'Submitting...' : 'Request Changes'}
                                </GlossyButton>
                                <GlossyButton
                                  size="sm"
                                  variant="action"
                                  disabled={submittingAction === 'review'}
                                  onClick={() => handleReviewSubmit(sub.id, 'approved')}
                                >
                                  {submittingAction === 'review' ? 'Approving...' : 'Approve Work'}
                                </GlossyButton>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewingSubId(sub.id)}
                              className="text-xs font-mono font-medium text-accent-cyan hover:underline cursor-pointer"
                            >
                              + Review this deliverable
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISCUSSION THREAD */}
          {activeTab === 'discussion' && (
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-cyber-muted italic">
                  No discussion comments yet. Start the engineering thread below.
                </div>
              ) : (
                <div className="space-y-2.5 pr-1">
                  {comments.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-3 rounded-xl bg-cyber-surface border border-cyber-border space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ChromeAvatar
                            name={comm.author?.full_name || 'Engineer'}
                            role={comm.author?.role || 'member'}
                            size="sm"
                          />
                          <span className="font-bold text-cyber-primary">
                            {comm.author?.full_name || 'Team Member'}
                          </span>
                        </div>
                        <span className="font-mono text-label text-cyber-muted">
                          {new Date(comm.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-cyber-secondary pl-8 leading-relaxed font-sans">
                        {comm.content}
                      </p>
                    </div>
                  ))}
                  <div ref={commentEndRef} />
                </div>
              )}

              {commentError && (
                <div className="p-2 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
                  {commentError}
                </div>
              )}
              {/* Add Comment Input */}
              <form onSubmit={handleCommentSubmit} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Post technical update or question..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl text-xs bg-cyber-surface border border-cyber-border text-cyber-primary focus:outline-none focus:border-accent-cyan placeholder:text-cyber-muted font-sans"
                />
                <GlossyButton
                  size="sm"
                  variant="primary"
                  type="submit"
                  disabled={submittingAction === 'comment' || !newComment.trim()}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  {submittingAction === 'comment' ? 'Posting...' : 'Reply'}
                </GlossyButton>
              </form>
            </div>
          )}

          {/* TAB 4: UNIFIED TELEMETRY TIMELINE (Objective 6) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 py-1">
              <div className="flex items-center justify-between text-label font-sans font-semibold text-cyber-secondary pb-2 border-b border-cyber-border">
                <span>Chronological Audit Trail</span>
                <span className="font-mono text-label text-cyber-muted">{timelineEvents.length} TOTAL EVENTS</span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-cyber-border">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative group">
                    {/* Node circle on timeline spine */}
                    <div
                      className="absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-cyber-bg-alt flex items-center justify-center transition-transform group-hover:scale-125 shadow-sm"
                      style={{ backgroundColor: evt.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-cyber-surface border border-cyber-border group-hover:border-cyber-border-strong transition-all space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-label font-mono font-medium px-2 py-0.5 rounded border uppercase"
                            style={{
                              backgroundColor: `${evt.color}15`,
                              borderColor: `${evt.color}40`,
                              color: evt.color,
                            }}
                          >
                            {evt.badgeText}
                          </span>
                          <span className="font-sans font-bold text-xs text-cyber-primary">
                            {evt.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-label text-cyber-muted">
                          <span className="text-accent-cyan font-bold">
                            {getDeltaTime(evt.timestamp, task.created_at)}
                          </span>
                          <span>•</span>
                          <span>{new Date(evt.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="text-xs font-mono text-cyber-secondary">
                        <span className="text-cyber-muted">Actor: </span>
                        <span className="text-cyber-primary font-bold">{evt.actor}</span>
                      </div>

                      {evt.details && (
                        <p className="text-xs text-cyber-secondary leading-relaxed bg-cyber-bg-alt p-2.5 rounded border border-cyber-border/40 font-sans">
                          {evt.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Task Confirmation Modal */}
      {isConfirmingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDeleting) {
              setIsConfirmingDelete(false);
              setDeleteError(null);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-6 rounded-xl bg-cyber-surface border border-accent-red/40 shadow-cyber-elevated space-y-4"
          >
            <div className="flex items-center gap-3 text-accent-red">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-wider text-cyber-primary">
                Delete Task Permanently?
              </h3>
            </div>
            <p className="text-xs text-cyber-secondary leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-cyber-primary font-mono">{task.title}</strong>? 
              This will remove this task, all versioned submissions, reviews, and discussion comments from the database.
            </p>
            {deleteError && (
              <div className="p-2.5 rounded bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <GlossyButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setIsConfirmingDelete(false); setDeleteError(null); }}
                disabled={isDeleting}
              >
                Cancel
              </GlossyButton>
              <GlossyButton
                type="button"
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={async () => {
                  if (!onDeleteTask) return;
                  setIsDeleting(true);
                  setDeleteError(null);
                  try {
                    await onDeleteTask(task.id);
                    setIsConfirmingDelete(false);
                    onClose();
                  } catch (err: unknown) {
                    setDeleteError(err instanceof Error ? err.message : 'Deletion failed');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </GlossyButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
