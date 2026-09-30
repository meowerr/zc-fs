import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  ExternalLink, 
  Send, 
  MessageSquare, 
  History, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { GlowInput } from '../common/GlowInput';
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
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'discussion'>('overview');
  
  // Submit work state
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [subType, setSubType] = useState<SubmissionType>('link');
  const [subContent, setSubContent] = useState('');
  const [subNotes, setSubNotes] = useState('');
  const [subError, setSubError] = useState<string | null>(null);

  // Review state
  const [reviewingSubId, setReviewingSubId] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Comment state
  const [newComment, setNewComment] = useState('');

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

    try {
      await onSubmitWork(task.id, subType, subContent, subNotes);
      setIsSubmittingWork(false);
      setSubContent('');
      setSubNotes('');
      setActiveTab('submissions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setSubError(msg);
    }
  };

  const handleReviewSubmit = async (subId: string, status: SubmissionReviewStatus) => {
    try {
      await onReviewSubmission(subId, task.id, status, reviewFeedback);
      setReviewingSubId(null);
      setReviewFeedback('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await onAddComment(task.id, newComment);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <GlassCard variant="elevated" className="w-full max-w-2xl max-h-[92vh] flex flex-col p-5 sm:p-7 my-auto border-telemetry-blue/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-chrome-300/60 dark:border-white/10 flex-shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-telemetry-blue dark:text-telemetry-aqua">
                {task.id}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 dark:bg-white/10 font-bold">
                {task.task_type}
              </span>
              <LedStatusChip status={task.priority} size="sm" />
            </div>

            <h3 className="font-sans font-bold text-lg sm:text-xl text-chrome-900 dark:text-white leading-snug">
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <LedStatusChip status={task.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-chrome-900/60 dark:text-white/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 my-3 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 flex-shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-midnight-800 text-telemetry-blue dark:text-telemetry-aqua shadow-sm'
                : 'text-chrome-900/60 dark:text-white/50 hover:text-chrome-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'submissions'
                ? 'bg-white dark:bg-midnight-800 text-telemetry-blue dark:text-telemetry-aqua shadow-sm'
                : 'text-chrome-900/60 dark:text-white/50 hover:text-chrome-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'discussion'
                ? 'bg-white dark:bg-midnight-800 text-telemetry-blue dark:text-telemetry-aqua shadow-sm'
                : 'text-chrome-900/60 dark:text-white/50 hover:text-chrome-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Thread ({comments.length})
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Description */}
              <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-1">
                <div className="text-[10px] font-mono text-chrome-900/50 dark:text-white/40 uppercase tracking-wider">
                  Technical Specifications & Objectives
                </div>
                <p className="text-sm text-chrome-900/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </p>
              </div>

              {/* Deadline & Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
                  <div className="text-[10px] font-mono text-chrome-900/50 dark:text-white/40 uppercase">
                    Deadline Target
                  </div>
                  <div className="text-xs font-mono font-bold text-telemetry-amber flex items-center gap-1.5 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(task.deadline).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
                  <div className="text-[10px] font-mono text-chrome-900/50 dark:text-white/40 uppercase">
                    Assigned Engineers
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {task.assignees && task.assignees.length > 0 ? (
                      task.assignees.map((a) => (
                        <div key={a.id} className="flex items-center gap-1.5 text-xs font-semibold">
                          <ChromeAvatar name={a.full_name} role={a.role} size="sm" />
                          <span>{a.full_name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-chrome-900/50 dark:text-white/40 italic">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Links */}
              {task.links && task.links.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold text-chrome-900/70 dark:text-white/60 uppercase">
                    Attached CAD / Document References
                  </div>
                  <div className="space-y-1.5">
                    {task.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 hover:border-telemetry-blue dark:hover:border-telemetry-aqua transition-all text-xs font-mono group"
                      >
                        <span className="flex items-center gap-2 text-chrome-900 dark:text-white font-medium">
                          <LinkIcon className="w-3.5 h-3.5 text-telemetry-blue" />
                          {link.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-chrome-900/40 dark:text-white/40 group-hover:text-telemetry-blue transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Status Action Bar */}
              <div className="pt-3 border-t border-chrome-300/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-mono text-chrome-900/60 dark:text-white/50">
                  Update Lifecycle State:
                </div>

                <div className="flex items-center gap-2">
                  {task.status === 'todo' && (
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
                      variant="holo"
                      onClick={() => setIsSubmittingWork(true)}
                    >
                      Submit Work Deliverable
                    </GlossyButton>
                  )}

                  {isHeadOrAdmin && task.status === 'approved' && (
                    <GlossyButton
                      size="sm"
                      variant="success"
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
                <GlassCard variant="telemetry" className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-chrome-300/40 dark:border-white/10">
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-telemetry-blue dark:text-telemetry-aqua">
                      Submit Work Deliverable (v{submissions.length + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSubmittingWork(false)}
                      className="text-xs text-chrome-900/50 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  {subError && (
                    <div className="p-2 rounded-lg bg-telemetry-red/10 text-telemetry-red text-xs font-mono">
                      {subError}
                    </div>
                  )}

                  <form onSubmit={handleWorkSubmit} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {(['link', 'note', 'file'] as SubmissionType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSubType(t)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                            subType === t
                              ? 'bg-telemetry-blue text-white shadow-sm'
                              : 'bg-white/40 dark:bg-white/5 text-chrome-900/60 dark:text-white/50'
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
                      <label className="block text-[11px] font-mono uppercase text-chrome-900/70 dark:text-white/60 mb-1">
                        Revision Notes for Reviewer
                      </label>
                      <textarea
                        rows={2}
                        value={subNotes}
                        onChange={(e) => setSubNotes(e.target.value)}
                        placeholder="Detail changes made, simulation parameters, or notes for the Sub-team Head..."
                        className="w-full p-2.5 rounded-xl text-xs bg-white/70 dark:bg-midnight-950/60 border border-chrome-300 dark:border-white/15 focus:outline-none focus:border-telemetry-blue text-chrome-900 dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <GhostButton size="sm" type="button" onClick={() => setIsSubmittingWork(false)}>
                        Cancel
                      </GhostButton>
                      <GlossyButton size="sm" variant="holo" type="submit">
                        Confirm Submission
                      </GlossyButton>
                    </div>
                  </form>
                </GlassCard>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-chrome-900/60 dark:text-white/50">
                    Submission History & Review Records
                  </span>
                  {(isAssignee || isHeadOrAdmin) && (
                    <GlossyButton size="sm" variant="holo" onClick={() => setIsSubmittingWork(true)}>
                      + New Submission
                    </GlossyButton>
                  )}
                </div>
              )}

              {/* Submissions List */}
              {submissions.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-chrome-900/50 dark:text-white/40 italic">
                  No deliverables submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-telemetry-blue dark:text-telemetry-aqua">
                            REV v{sub.version_number}
                          </span>
                          <span className="text-chrome-900/60 dark:text-white/50 font-mono text-[11px]">
                            {new Date(sub.created_at).toLocaleString()}
                          </span>
                        </div>

                        <LedStatusChip status={sub.review_status} size="sm" />
                      </div>

                      <div className="text-xs font-sans">
                        <span className="font-bold text-chrome-900 dark:text-white">Content: </span>
                        {sub.submission_type === 'link' ? (
                          <a
                            href={sub.content}
                            target="_blank"
                            rel="noreferrer"
                            className="text-telemetry-blue dark:text-telemetry-aqua hover:underline inline-flex items-center gap-1 font-mono"
                          >
                            {sub.content} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="font-mono">{sub.content}</span>
                        )}
                      </div>

                      {sub.notes && (
                        <div className="text-xs text-chrome-900/70 dark:text-white/60 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                          <span className="font-semibold text-chrome-900 dark:text-white">Notes: </span>
                          {sub.notes}
                        </div>
                      )}

                      {/* Review Feedback if present */}
                      {sub.review_feedback && (
                        <div className="p-2.5 rounded-lg bg-telemetry-blue/10 dark:bg-telemetry-aqua/10 border border-telemetry-blue/20 text-xs space-y-1">
                          <div className="font-mono font-bold text-telemetry-blue dark:text-telemetry-aqua flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Reviewer Feedback:
                          </div>
                          <p className="text-chrome-900/80 dark:text-white/80">{sub.review_feedback}</p>
                        </div>
                      )}

                      {/* Head Review Action Box */}
                      {isHeadOrAdmin && sub.review_status === 'pending' && (
                        <div className="pt-2 border-t border-chrome-300/40 dark:border-white/10">
                          {reviewingSubId === sub.id ? (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={reviewFeedback}
                                onChange={(e) => setReviewFeedback(e.target.value)}
                                placeholder="Enter constructive feedback or change requests..."
                                className="w-full p-2 text-xs rounded-lg bg-white dark:bg-midnight-900 border border-chrome-300 dark:border-white/20 text-chrome-900 dark:text-white"
                              />
                              <div className="flex justify-end gap-2">
                                <GhostButton size="sm" onClick={() => setReviewingSubId(null)}>
                                  Cancel
                                </GhostButton>
                                <GlossyButton
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleReviewSubmit(sub.id, 'changes_requested')}
                                >
                                  Request Changes
                                </GlossyButton>
                                <GlossyButton
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleReviewSubmit(sub.id, 'approved')}
                                >
                                  Approve Work
                                </GlossyButton>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewingSubId(sub.id)}
                              className="text-xs font-mono font-bold text-telemetry-blue dark:text-telemetry-aqua hover:underline cursor-pointer"
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
                <div className="py-8 text-center text-xs font-mono text-chrome-900/50 dark:text-white/40 italic">
                  No discussion comments yet. Start the engineering thread below.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {comments.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ChromeAvatar
                            name={comm.author?.full_name || 'Engineer'}
                            role={comm.author?.role || 'member'}
                            size="sm"
                          />
                          <span className="font-bold text-chrome-900 dark:text-white">
                            {comm.author?.full_name || 'Team Member'}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-chrome-900/40 dark:text-white/40">
                          {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-chrome-900/80 dark:text-white/80 pl-8 leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <form onSubmit={handleCommentSubmit} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Post technical update or question..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl text-xs bg-white/70 dark:bg-midnight-950/60 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
                />
                <GlossyButton size="sm" variant="primary" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
                  Reply
                </GlossyButton>
              </form>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
