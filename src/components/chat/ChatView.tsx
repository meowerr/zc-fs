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
  Link as LinkIcon
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { LedStatusChip } from '../common/LedStatusChip';
import { ChromeAvatar } from '../common/ChromeAvatar';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    messagesEndRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachmentUrl.trim()) return;

    try {
      await onSendMessage(
        inputText,
        attachmentUrl
          ? {
              url: attachmentUrl,
              name: 'Attached Link / Spec',
              type: 'link',
            }
          : undefined
      );
      setInputText('');
      setAttachmentUrl('');
      setShowAttachInput(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const getChatTitle = () => {
    if (activeConversationId && otherParticipant) {
      return otherParticipant.full_name;
    }
    return currentChannel ? currentChannel.name : 'Telemetry Channel';
  };

  const getChatSubtitle = () => {
    if (activeConversationId && otherParticipant) {
      return `Direct message · ${otherParticipant.email}`;
    }
    return currentChannel?.description || 'Sub-team channel';
  };

  return (
    <div className="h-[calc(100dvh-10rem-env(safe-area-inset-bottom))] min-h-[420px] md:h-[calc(100dvh-8rem)] flex flex-col md:flex-row gap-3">
      {/* LEFT: Channels & Direct Messages Sidebar */}
      <GlassCard
        cornerMark={false}
        role="navigation"
        aria-label="Conversations"
        className={`
          w-full md:w-64 lg:w-72 flex-shrink-0 flex-col p-3 overflow-hidden
          ${showMobileList ? 'flex' : 'hidden md:flex'}
        `}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-cyber-border">
          <h2 className="font-display font-bold text-sm text-cyber-primary tracking-wide px-1">Pit Wall</h2>
          <button
            type="button"
            onClick={() => setIsDMModalOpen(true)}
            aria-label="New direct message"
            title="New direct message"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyber-surface-elevated hover:bg-cyber-surface-hover border border-cyber-border hover:border-accent-cyan/60 text-cyber-secondary hover:text-accent-cyan transition-colors duration-fast cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Channel & DM List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-2.5 pr-1">
          {/* Section: Channels */}
          <div>
            <h3 className="micro-label mb-1.5 px-1.5">Channels</h3>
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
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    className={`
                      w-full flex items-center gap-2.5 h-10 px-2.5 rounded-lg text-left transition-colors duration-fast cursor-pointer
                      ${isActive ? 'bg-accent-cyan/10 text-cyber-primary font-semibold' : 'text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover'}
                    `}
                  >
                    <div className="flex-shrink-0">
                      {isHeadsOnly ? (
                        <Lock className="w-4 h-4 text-accent-red" aria-label="Heads only" />
                      ) : isAnnouncements ? (
                        <Radio className="w-4 h-4 text-accent-yellow" aria-label="Announcements" />
                      ) : (
                        <Hash className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>
                    <span className="text-sm truncate">
                      {channel.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Direct Messages */}
          <div>
            <div className="flex items-center justify-between text-2xs font-mono uppercase tracking-wider text-cyber-muted mb-1 px-1.5">
              <h3 className="micro-label">Direct messages</h3>
              <button
                type="button"
                onClick={() => setIsDMModalOpen(true)}
                className="h-7 px-2 rounded-md text-accent-cyan hover:bg-accent-cyan/10 cursor-pointer normal-case font-sans font-semibold text-xs tracking-normal"
              >
                New
              </button>
            </div>

            <div className="space-y-1">
              {conversations.length === 0 ? (
                <p className="px-1.5 py-2 text-xs text-cyber-muted">
                  No conversations yet. Start one with a teammate.
                </p>
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

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        setShowMobileList(false);
                      }}
                      aria-current={isActive ? 'true' : undefined}
                      className={`
                        w-full flex items-center gap-2.5 h-11 px-2 rounded-lg text-left transition-colors duration-fast cursor-pointer
                        ${isActive ? 'bg-accent-cyan/10 text-cyber-primary font-semibold' : 'text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover'}
                      `}
                    >
                      <ChromeAvatar name={partner.full_name} role={partner.role} size="sm" />
                      <span className="text-sm truncate">
                        {partner.full_name}
                      </span>
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
        cornerMark={false}
        className={`
          flex-1 min-w-0 flex-col p-3 sm:p-4 overflow-hidden
          ${showMobileList ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Chat Stream Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowMobileList(true)}
              aria-label="Show all conversations"
              className="md:hidden w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-cyber-primary"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <h2 className="font-display font-bold text-sm text-cyber-primary truncate tracking-wide">
                {activeConversationId ? '' : '# '}{getChatTitle()}
              </h2>
              <p className="text-xs text-cyber-muted truncate max-w-xs sm:max-w-md">
                {getChatSubtitle()}
              </p>
            </div>
          </div>

          <div className="hidden sm:block flex-shrink-0">
            <LedStatusChip status="online" customLabel="Live" size="sm" />
          </div>
        </div>

        {/* Message Stream */}
        <div role="log" aria-live="polite" aria-label={`Messages in ${getChatTitle()}`} className="flex-1 overflow-y-auto py-2.5 px-1 space-y-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-cyber-bg-alt border border-cyber-border flex items-center justify-center text-accent-cyan">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="font-semibold text-sm text-cyber-primary">No messages yet</p>
              <p className="text-sm text-cyber-secondary max-w-xs">
                {canPost ? 'Kick off the discussion — share an update, a question or a CAD link.' : 'Announcements from club leadership will appear here.'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUser.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="pt-2.5 border-t border-cyber-border flex-shrink-0">
          {!canPost ? (
            <div className="p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border text-center text-xs text-cyber-secondary flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-accent-yellow shrink-0" aria-hidden="true" />
              <span>Read-only channel. Only club admins and group heads can post announcements.</span>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-2">
              {showAttachInput && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-cyber-bg-alt border border-cyber-border animate-fade-in">
                  <LinkIcon className="w-4 h-4 text-accent-cyan shrink-0" aria-hidden="true" />
                  <label htmlFor="chat-attachment" className="sr-only">Attachment link</label>
                  <input
                    id="chat-attachment"
                    type="url"
                    placeholder="Paste a CAD or document link (https://…)"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="flex-1 text-xs bg-transparent border-none text-cyber-primary focus:outline-none font-mono placeholder:text-cyber-muted"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowAttachInput(false); setAttachmentUrl(''); }}
                    className="h-8 px-2 rounded-md text-xs text-cyber-muted hover:text-accent-red hover:bg-accent-red/10 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachInput((prev) => !prev)}
                  aria-label={showAttachInput ? 'Hide attachment link' : 'Attach a link'}
                  aria-pressed={showAttachInput}
                  className={`
                    w-11 h-11 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-lg border transition-colors duration-fast cursor-pointer
                    ${
                      showAttachInput
                        ? 'bg-accent-cyan text-on-accent border-accent-cyan'
                        : 'bg-cyber-surface-elevated border-cyber-border text-cyber-muted hover:text-cyber-primary hover:border-cyber-border-strong'
                    }
                  `}
                  title="Attach a link"
                >
                  <Paperclip className="w-4 h-4" aria-hidden="true" />
                </button>

                <label htmlFor="chat-message" className="sr-only">Message</label>
                <input
                  id="chat-message"
                  type="text"
                  autoComplete="off"
                  enterKeyHint="send"
                  placeholder={`Message ${activeConversationId ? '' : '#'}${getChatTitle()}`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 min-w-0 h-11 sm:h-10 px-3 rounded-lg text-sm"
                />

                <GlossyButton
                  size="sm"
                  variant="primary"
                  type="submit"
                  disabled={!inputText.trim() && !attachmentUrl.trim()}
                  aria-label="Send message"
                  icon={<Send className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Send</span>
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
        }}
      />
    </div>
  );
};
