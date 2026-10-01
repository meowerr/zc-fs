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
  AlertCircle,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setAttachmentUrl('');
      setShowAttachInput(false);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage(
        err?.message || 'Transmission failed. Verify permissions or network connection.'
      );
    } finally {
      setIsSending(false);
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
      return `DIRECT // ${otherParticipant.role.toUpperCase()} // ${otherParticipant.email}`;
    }
    return currentChannel?.description || 'Active sub-team telemetry channel';
  };

  return (
    <div className="h-[calc(100vh-9.5rem)] md:h-[calc(100vh-7.5rem)] flex flex-col md:flex-row gap-3.5">
      {/* LEFT: Channels & Direct Messages Sidebar */}
      <GlassCard
        className={`
          w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col p-3.5 overflow-hidden
          ${showMobileList ? 'flex' : 'hidden md:flex'}
        `}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-cyber-border">
          <div className="flex items-center gap-1.5 font-mono text-xs text-cyber-primary font-bold">
            <Radio className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
            <span className="uppercase tracking-wider">PIT WALL // COMMS</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDMModalOpen(true)}
              className="p-1 rounded bg-cyber-surface-elevated hover:bg-cyber-surface-hover border border-cyber-border hover:border-accent-cyan text-cyber-secondary hover:text-accent-cyan transition-all cursor-pointer"
              title="Start Direct Message"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowMobileList(false)}
              className="md:hidden p-1 rounded bg-cyber-surface-elevated hover:bg-cyber-surface-hover border border-cyber-border text-cyber-secondary hover:text-cyber-primary transition-all cursor-pointer"
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
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyber-muted mb-1 px-1.5">
              // CHANNELS
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
                      w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer border
                      ${
                        isActive
                          ? 'bg-cyber-surface-elevated text-accent-cyan border-l-2 border-l-accent-cyan border-y border-r border-cyber-border font-bold shadow-cyber-sm'
                          : 'bg-transparent border-transparent text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover hover:border-cyber-border'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      {isHeadsOnly ? (
                        <Lock className="w-3.5 h-3.5 text-accent-red" />
                      ) : isAnnouncements ? (
                        <Radio className="w-3.5 h-3.5 text-accent-yellow" />
                      ) : (
                        <Hash className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-xs font-sans truncate">
                      {channel.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Direct Messages */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyber-muted mb-1 px-1.5">
              <span>// DIRECT COMMS</span>
              <button
                onClick={() => setIsDMModalOpen(true)}
                className="text-accent-cyan hover:underline cursor-pointer lowercase font-mono text-[10px]"
              >
                + new
              </button>
            </div>

            <div className="space-y-1">
              {conversations.length === 0 ? (
                <div className="px-2 py-2 text-[10px] font-mono text-cyber-muted italic">
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

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        setShowMobileList(false);
                        setErrorMessage(null);
                      }}
                      className={`
                        w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer border
                        ${
                          isActive
                            ? 'bg-cyber-surface-elevated text-accent-cyan border-l-2 border-l-accent-cyan border-y border-r border-cyber-border font-bold shadow-cyber-sm'
                            : 'bg-transparent border-transparent text-cyber-secondary hover:text-cyber-primary hover:bg-cyber-surface-hover hover:border-cyber-border'
                        }
                      `}
                    >
                      <ChromeAvatar name={partner.full_name} role={partner.role} size="sm" />
                      <span className="text-xs font-sans truncate">
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
        className={`
          flex-1 flex flex-col p-3.5 sm:p-4 overflow-hidden
          ${showMobileList ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Chat Stream Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden inline-flex items-center gap-1 px-2 py-1 rounded bg-cyber-surface-elevated border border-cyber-border text-cyber-secondary hover:text-cyber-primary text-xs font-mono cursor-pointer"
              title="Channels & DMs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Channels</span>
            </button>

            <div className="min-w-0">
              <h3 className="font-display font-bold text-xs sm:text-sm text-cyber-primary truncate uppercase tracking-wider">
                {getChatTitle()}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-cyber-muted truncate max-w-xs sm:max-w-md">
                {getChatSubtitle()}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <LedStatusChip status="online" customLabel="TELEMETRY LIVE" size="sm" />
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto py-2.5 px-1 space-y-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-cyber-bg-alt border border-cyber-border flex items-center justify-center text-accent-cyan">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-cyber-primary uppercase tracking-wider">
                Channel Clear
              </h4>
              <p className="text-xs text-cyber-secondary max-w-xs">
                No telemetry messages recorded yet. Begin the engineering discussion below.
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

        {/* Chat Input Bar & Error Feedback */}
        <div className="pt-2.5 border-t border-cyber-border flex-shrink-0 space-y-2">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono animate-fade-in">
              <div className="flex items-center gap-1.5 truncate">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-accent-red hover:underline text-[10px] ml-2 flex-shrink-0 cursor-pointer uppercase font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {!canPost ? (
            <div className="p-3 rounded-lg bg-cyber-bg-alt border border-cyber-border text-xs font-mono space-y-2">
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-surface-elevated hover:bg-cyber-surface-hover border border-accent-cyan/40 hover:border-accent-cyan text-accent-cyan text-[11px] font-mono font-bold transition-all cursor-pointer self-start sm:self-auto"
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
                  <LinkIcon className="w-3.5 h-3.5 text-accent-cyan" />
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachInput((prev) => !prev)}
                  className={`
                    p-2 rounded-lg border transition-all cursor-pointer
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

                <input
                  type="text"
                  placeholder={`Transmit message to ${getChatTitle()}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg text-xs sm:text-sm bg-cyber-surface-elevated border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan"
                />

                <GlossyButton
                  size="sm"
                  variant="primary"
                  type="submit"
                  disabled={isSending || (!inputText.trim() && !attachmentUrl.trim())}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  {isSending ? 'Sending...' : 'Send'}
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
