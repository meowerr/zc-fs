import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Hash, 
  Lock, 
  MessageSquare, 
  Plus, 
  Radio, 
  Paperclip, 
  ChevronLeft, 
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { parseUserIdentity } from '../common/UserLabel';
import { MessageBubble } from './MessageBubble';
import { NewDMModal } from './NewDMModal';
import { Channel, Conversation, Message, Profile } from '../../lib/database.types';

interface ChatViewProps {
  currentUser: Profile;
  allProfiles: Profile[];
  accessibleChannels: Channel[];
  activeChannelId: string;
  activeConversationId: string | null;
  currentChannel?: Channel;
  currentConversation?: Conversation;
  otherParticipant?: Profile;
  conversations: Conversation[];
  messages: Message[];
  canPost: boolean;
  onSelectChannel: (channelId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onSendMessage: (content: string, attachment?: { url: string; name: string; type: string }) => Promise<void>;
  onStartDirectMessage: (userId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  allProfiles,
  accessibleChannels,
  activeChannelId,
  activeConversationId,
  currentChannel,
  otherParticipant,
  conversations,
  messages,
  canPost,
  onSelectChannel,
  onSelectConversation,
  onSendMessage,
  onStartDirectMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const isNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(messages.length);

  // Hide mobile bottom nav pill while in active chat view
  useEffect(() => {
    if (!showMobileList) {
      document.documentElement.setAttribute('data-hide-mobile-nav', 'true');
    } else {
      document.documentElement.removeAttribute('data-hide-mobile-nav');
    }
    return () => {
      document.documentElement.removeAttribute('data-hide-mobile-nav');
    };
  }, [showMobileList]);

  // Keep composer above the mobile virtual keyboard using visualViewport
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', `${kb}px`);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
      document.documentElement.style.removeProperty('--kb');
    };
  }, []);

  // Auto-scroll on channel/conversation switch
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    isNearBottomRef.current = true;
    setHasNewMessages(false);
    prevMessagesCountRef.current = messages.length;
  }, [activeChannelId, activeConversationId]);

  // Handle auto-scroll vs "↓ New messages" pill
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const isOwn = lastMsg?.sender_id === currentUser.id;

    if (isOwn || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
    } else if (messages.length > prevMessagesCountRef.current) {
      setHasNewMessages(true);
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, currentUser.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isNearBottomRef.current = isAtBottom;
    if (isAtBottom) {
      setHasNewMessages(false);
    }
  };

  // Find user's assigned sub-team channel (for quick-switch prompt)
  const userTeamChannel = accessibleChannels.find(
    (c) => c.channel_type === 'group' && c.group_id === currentUser.group_id
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachmentUrl.trim()) return;
    if (isSending) return;

    setErrorMessage(null);
    setIsSending(true);

    const sentContent = inputText;
    const sentAttachment = attachmentUrl
      ? {
          url: attachmentUrl,
          name: 'Attached Link / Spec',
          type: 'link',
        }
      : undefined;

    try {
      await onSendMessage(sentContent, sentAttachment);
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.overflowY = 'hidden';
      }
      setAttachmentUrl('');
      setShowAttachInput(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage(
        err?.message || 'Transmission failed. Verify permissions or network connection.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const otherIdentity = otherParticipant
    ? parseUserIdentity(otherParticipant.full_name, otherParticipant.email)
    : null;

  const chatTitle = activeConversationId && otherIdentity
    ? otherIdentity.displayName
    : currentChannel?.name || 'Telemetry Channel';

  const chatSubtitle = activeConversationId && otherParticipant
    ? `Direct · ${otherParticipant.role}${otherIdentity?.studentId ? ` · ID: ${otherIdentity.studentId}` : ''}`
    : currentChannel?.description || 'Active sub-team telemetry channel';

  // Helper for date separator chip formatting
  const getDateLabel = (isoDate: string): string => {
    const d = new Date(isoDate);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    now.setDate(now.getDate() - 1);
    return d.toDateString() === now.toDateString()
      ? 'Yesterday'
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100dvh-9.5rem)] md:h-[calc(100dvh-7.5rem)] flex flex-col md:flex-row gap-3.5">
      {/* LEFT: Channels & Direct Messages Sidebar */}
      <GlassCard
        className={`
          w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col p-3.5 overflow-hidden
          ${showMobileList ? 'flex' : 'hidden md:flex'}
        `}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-cyber-border">
          <div className="hidden md:flex items-center gap-1.5 font-sans text-xs text-cyber-primary font-semibold">
            <Radio className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
            <span className="uppercase tracking-wider">Pit Wall Comms</span>
          </div>
          <span className="md:hidden text-xs font-semibold text-cyber-secondary">
            Channels
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDMModalOpen(true)}
              aria-label="New direct message"
              title="New direct message"
              className="group relative p-1.5 rounded-lg bg-cyber-surface-elevated hover:bg-cyber-surface-hover border border-cyber-border hover:border-accent-cyan text-cyber-secondary hover:text-accent-cyan transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <Plus className="w-4 h-4 text-accent-cyan" />
              <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap bg-cyber-surface-elevated border border-cyber-border text-label text-cyber-primary px-2 py-0.5 rounded shadow-cyber opacity-0 group-hover:opacity-100 transition z-20">New DM</span>
            </button>
            <button
              onClick={() => setShowMobileList(false)}
              className="md:hidden p-1.5 rounded-lg bg-cyber-surface-elevated hover:bg-cyber-surface-hover border border-cyber-border text-cyber-secondary hover:text-cyber-primary transition-all cursor-pointer"
              title="Close Channels List"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Channel & DM List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-2.5 pr-1">
          {/* Section: Channels */}
          <div>
            <div className="text-label font-sans font-semibold text-cyber-secondary mb-1.5 px-2">
              CHANNELS
            </div>
            <div className="space-y-1">
              {accessibleChannels.map((channel) => {
                const isActive = !activeConversationId && activeChannelId === channel.id;
                const isHeadsOnly = channel.channel_type === 'heads_only';
                const isAnnouncements = channel.channel_type === 'announcements';

                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      onSelectChannel(channel.id);
                      setShowMobileList(false);
                      setErrorMessage(null);
                    }}
                    className={`
                      w-full min-h-[56px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer border active:scale-[0.99]
                      ${
                        isActive
                          ? 'bg-cyber-surface-elevated text-cyber-primary border-accent-cyan font-bold shadow-cyber-sm'
                          : 'bg-transparent border-transparent text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover hover:border-cyber-border'
                      }
                    `}
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyber-bg-alt border border-cyber-border flex items-center justify-center shrink-0">
                      {isHeadsOnly ? (
                        <Lock className="w-4 h-4 text-accent-red" />
                      ) : isAnnouncements ? (
                        <Radio className="w-4 h-4 text-accent-yellow" />
                      ) : (
                        <Hash className="w-4 h-4 text-accent-cyan" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-body sm:text-xs font-sans font-medium text-cyber-primary truncate">
                        {channel.name}
                      </div>
                      <div className="text-label font-sans text-cyber-muted truncate mt-0.5">
                        {channel.description || 'Active sub-team telemetry channel'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Direct Messages */}
          <div>
            <div className="flex items-center justify-between text-label font-sans font-semibold text-cyber-secondary mb-1.5 px-2">
              <span>DIRECT MESSAGES</span>
              <button
                onClick={() => setIsDMModalOpen(true)}
                className="text-accent-cyan hover:underline cursor-pointer font-sans text-label font-medium"
              >
                + New DM
              </button>
            </div>

            <div className="space-y-1">
              {conversations.length === 0 ? (
                <div className="px-2 py-3 text-label font-sans text-cyber-muted italic">
                  No active DMs. Click + to transmit.
                </div>
              ) : (
                conversations.map((conv) => {
                  const partner = allProfiles.find(
                    (p) =>
                      p.id ===
                      (conv.participant_1 === currentUser.id
                        ? conv.participant_2
                        : conv.participant_1)
                  );
                  if (!partner) return null;

                  const isActive = activeConversationId === conv.id;
                  const partnerRole =
                    partner.role === 'admin'
                      ? 'Club Admin'
                      : partner.role === 'head'
                      ? 'Group Head'
                      : 'Engineer';
                  const { displayName, studentId } = parseUserIdentity(partner.full_name, partner.email);

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        setShowMobileList(false);
                        setErrorMessage(null);
                      }}
                      className={`
                        w-full min-h-[56px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer border active:scale-[0.99]
                        ${
                          isActive
                            ? 'bg-cyber-surface-elevated text-cyber-primary border-accent-cyan font-bold shadow-cyber-sm'
                            : 'bg-transparent border-transparent text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover hover:border-cyber-border'
                        }
                      `}
                    >
                      <ChromeAvatar name={displayName} role={partner.role} size="sm" className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-body sm:text-xs font-sans font-medium text-cyber-primary truncate">
                          {displayName}
                        </div>
                        <div className="text-label font-sans text-cyber-muted truncate mt-0.5 flex items-center gap-1.5">
                          <span>{partnerRole}</span>
                          {studentId && <span className="font-mono text-text-muted">#{studentId}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* RIGHT: Chat Messages Stream & Input */}
      <GlassCard
        className={`
          flex-1 flex flex-col p-3.5 sm:p-4 overflow-hidden relative
          ${showMobileList ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Chat Stream Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-cyber-primary text-xs font-sans font-medium cursor-pointer"
              title="Channels & DMs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Channels</span>
            </button>

            <div className="min-w-0">
              <h3 className="font-display font-bold text-xs sm:text-sm text-cyber-primary truncate uppercase tracking-wider">
                {chatTitle}
              </h3>
              <p className="text-label font-sans text-cyber-muted truncate max-w-xs sm:max-w-md">
                {chatSubtitle}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <LedStatusChip status="online" customLabel="TELEMETRY LIVE" size="sm" />
          </div>
        </div>

        {/* Message Stream */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-2.5 px-1 space-y-0.5 relative"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-cyber-bg-alt border border-cyber-border flex items-center justify-center text-accent-cyan">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-cyber-primary uppercase tracking-wider">
                Channel Clear
              </h4>
              <p className="text-xs text-cyber-secondary max-w-xs font-sans">
                No telemetry messages recorded yet. Begin the engineering discussion below.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
              const showDate = !prevMsg || prevMsg.created_at.slice(0, 10) !== msg.created_at.slice(0, 10);
              const msgTime = new Date(msg.created_at).getTime();
              const isSameSenderAsPrev = Boolean(prevMsg) && prevMsg!.sender_id === msg.sender_id && !showDate && msgTime - new Date(prevMsg!.created_at).getTime() < 300000;
              const isSameSenderAsNext = Boolean(nextMsg) && nextMsg!.sender_id === msg.sender_id && nextMsg!.created_at.slice(0, 10) === msg.created_at.slice(0, 10) && new Date(nextMsg!.created_at).getTime() - msgTime < 300000;
              const isOwn = msg.sender_id === currentUser.id;

              return (
                <React.Fragment key={msg.id || i}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="px-3 py-0.5 rounded-full bg-cyber-surface border border-cyber-border text-label font-sans font-medium text-cyber-secondary shadow-cyber-sm">
                        {getDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showSenderHeader={!isOwn && !isSameSenderAsPrev}
                    showAvatar={!isOwn && !isSameSenderAsNext}
                    showTimestamp={!isSameSenderAsNext}
                    isLastInGroup={!isSameSenderAsNext}
                  />
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating "↓ New messages" Pill */}
        {hasNewMessages && (
          <button
            type="button"
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setHasNewMessages(false);
            }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-accent-cyan text-black font-sans font-semibold text-xs shadow-cyber flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
          >
            <span>↓ New messages</span>
          </button>
        )}

        {/* Chat Input Bar & Error Feedback */}
        <div className="pt-2.5 border-t border-cyber-border flex-shrink-0 space-y-2">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-sans animate-fade-in">
              <div className="flex items-center gap-1.5 truncate">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-accent-red hover:underline text-label ml-2 flex-shrink-0 cursor-pointer uppercase font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {!canPost ? (
            <div className="p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border text-xs font-sans space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-cyber-muted">
                  <Lock className="w-3.5 h-3.5 text-accent-yellow flex-shrink-0" />
                  <span>Broadcast Channel: Club Admins & Sub-team Heads only.</span>
                </div>
                {userTeamChannel && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChannel(userTeamChannel.id);
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-surface-elevated hover:bg-cyber-surface-hover border border-accent-cyan/40 hover:border-accent-cyan text-accent-cyan text-label font-sans font-medium transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <span>Switch to #{userTeamChannel.name}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-2">
              {showAttachInput && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-cyber-bg-alt border border-cyber-border animate-fade-in">
                  <Paperclip className="w-3.5 h-3.5 text-accent-cyan" />
                  <input
                    type="url"
                    placeholder="Attach CAD URL or document link (https://...)"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="flex-1 text-xs bg-transparent border-none text-cyber-primary focus:outline-none font-mono placeholder:text-cyber-muted"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowAttachInput(false); setAttachmentUrl(''); }}
                    className="text-xs text-cyber-muted hover:text-accent-red font-mono cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div
                className="flex items-end gap-2"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--kb, 0px))' }}
              >
                <button
                  type="button"
                  onClick={() => setShowAttachInput((prev) => !prev)}
                  className={`
                    tap-target rounded-lg border transition-all cursor-pointer shrink-0
                    ${
                      showAttachInput
                        ? 'bg-accent-cyan text-black border-accent-cyan'
                        : 'bg-cyber-surface-elevated border-cyber-border text-cyber-muted hover:text-cyber-primary hover:border-cyber-border-strong'
                    }
                  `}
                  title="Attach CAD or Web Link"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Message…"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                    el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  className="flex-1 min-h-[44px] max-h-[120px] py-[10px] px-3 resize-none overflow-hidden text-base leading-6 rounded-lg bg-cyber-surface-elevated border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan font-sans"
                />

                <GlossyButton
                  size="sm"
                  variant="primary"
                  type="submit"
                  disabled={isSending || (!inputText.trim() && !attachmentUrl.trim())}
                  icon={<Send className="w-4 h-4" />}
                  className="min-h-[44px] min-w-[44px] px-3 shrink-0 flex items-center justify-center"
                >
                  <span className="hidden sm:inline">{isSending ? 'Sending…' : 'Send'}</span>
                </GlossyButton>
              </div>
            </form>
          )}
        </div>
      </GlassCard>

      {/* New DM Modal */}
      <NewDMModal
        isOpen={isDMModalOpen}
        onClose={() => setIsDMModalOpen(false)}
        currentUser={currentUser}
        allProfiles={allProfiles}
        onSelectUser={(userId) => {
          onStartDirectMessage(userId);
          setShowMobileList(false);
          setErrorMessage(null);
        }}
      />
    </div>
  );
};
