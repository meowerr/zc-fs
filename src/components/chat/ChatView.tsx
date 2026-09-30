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
  Sparkles,
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      return `Direct Message • ${otherParticipant.role.toUpperCase()} • ${otherParticipant.email}`;
    }
    return currentChannel?.description || 'Active sub-team telemetry channel';
  };

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4">
      {/* LEFT: Channels & Direct Messages Sidebar */}
      <GlassCard
        className={`
          w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col p-4 overflow-hidden
          ${showMobileList ? 'flex' : 'hidden md:flex'}
        `}
      >
        <div className="flex items-center justify-between pb-3 border-b border-chrome-300/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-telemetry-aqua animate-pulse" />
            <h3 className="font-display font-bold text-sm text-chrome-900 dark:text-white uppercase tracking-wider">
              Pit Wall Comms
            </h3>
          </div>
          <button
            onClick={() => setIsDMModalOpen(true)}
            className="p-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-telemetry-blue hover:text-white transition-all text-chrome-900/70 dark:text-white/70 cursor-pointer"
            title="Start Direct Message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Channel & DM List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Section: Channels */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-chrome-900/50 dark:text-white/40 mb-1.5 px-2">
              Channels
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
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer
                      ${
                        isActive
                          ? 'bg-telemetry-blue text-white shadow-neon-blue/30 font-bold'
                          : 'text-chrome-900/75 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/10 hover:text-chrome-900'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      {isHeadsOnly ? (
                        <Lock className="w-3.5 h-3.5 text-telemetry-pink" />
                      ) : isAnnouncements ? (
                        <Sparkles className="w-3.5 h-3.5 text-telemetry-amber" />
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
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-chrome-900/50 dark:text-white/40 mb-1.5 px-2">
              <span>Direct Messages</span>
              <button
                onClick={() => setIsDMModalOpen(true)}
                className="text-telemetry-blue dark:text-telemetry-aqua hover:underline cursor-pointer lowercase font-sans font-bold"
              >
                + new
              </button>
            </div>

            <div className="space-y-1">
              {conversations.length === 0 ? (
                <div className="px-2 py-3 text-[11px] font-mono text-chrome-900/40 dark:text-white/40 italic">
                  No active DMs. Click + to chat with teammates.
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
                      }}
                      className={`
                        w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer
                        ${
                          isActive
                            ? 'bg-telemetry-blue text-white shadow-neon-blue/30 font-bold'
                            : 'text-chrome-900/75 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/10'
                        }
                      `}
                    >
                      <ChromeAvatar name={partner.full_name} role={partner.role} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-sans truncate font-medium">
                          {partner.full_name}
                        </div>
                        <div className="text-[9px] font-mono opacity-70 uppercase truncate">
                          {partner.role}
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

      {/* RIGHT: Active Chat Conversation Area */}
      <GlassCard
        className={`
          flex-1 flex flex-col p-4 sm:p-5 overflow-hidden
          ${showMobileList ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Chat Area Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-chrome-300/60 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile back to channel list button */}
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden p-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-chrome-900 dark:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {activeConversationId ? (
                  <MessageSquare className="w-4 h-4 text-telemetry-aqua flex-shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 text-telemetry-blue flex-shrink-0" />
                )}
                <h3 className="font-display font-bold text-sm sm:text-base text-chrome-900 dark:text-white uppercase tracking-wider truncate">
                  {getChatTitle()}
                </h3>
              </div>
              <p className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50 truncate max-w-xs sm:max-w-md">
                {getChatSubtitle()}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <LedStatusChip status="online" customLabel="TELEMETRY LIVE" size="sm" />
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto py-3 px-1 space-y-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-telemetry-blue/10 flex items-center justify-center text-telemetry-blue">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-sm text-chrome-900 dark:text-white">
                Channel Clear
              </h4>
              <p className="text-xs text-chrome-900/60 dark:text-white/50 max-w-xs">
                No telemetry messages here yet. Be the first to start the engineering thread.
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
        <div className="pt-3 border-t border-chrome-300/60 dark:border-white/10 flex-shrink-0">
          {!canPost ? (
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center text-xs font-mono text-chrome-900/60 dark:text-white/50 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-telemetry-amber" />
              <span>Broadcast Channel: Only Club Admins & Sub-team Heads may post official announcements.</span>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-2">
              {showAttachInput && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 animate-fade-in">
                  <LinkIcon className="w-3.5 h-3.5 text-telemetry-blue" />
                  <input
                    type="url"
                    placeholder="Attach CAD URL or document link (https://...)"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="flex-1 text-xs bg-transparent border-none text-chrome-900 dark:text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowAttachInput(false); setAttachmentUrl(''); }}
                    className="text-xs text-chrome-900/50 hover:underline"
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
                    p-2.5 rounded-xl border transition-all cursor-pointer
                    ${
                      showAttachInput
                        ? 'bg-telemetry-blue text-white border-telemetry-blue'
                        : 'bg-white/70 dark:bg-midnight-950/60 border-chrome-300 dark:border-white/15 text-chrome-900/60 dark:text-white/60 hover:text-telemetry-blue'
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
                  className="flex-1 h-11 px-4 rounded-xl text-xs sm:text-sm bg-white/70 dark:bg-midnight-950/60 border border-chrome-300 dark:border-white/15 text-chrome-900 dark:text-white focus:outline-none focus:border-telemetry-blue"
                />

                <GlossyButton
                  size="md"
                  variant="primary"
                  type="submit"
                  icon={<Send className="w-4 h-4" />}
                >
                  Send
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
