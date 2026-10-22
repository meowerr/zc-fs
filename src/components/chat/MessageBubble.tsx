import React from 'react';
import { ExternalLink, Paperclip } from 'lucide-react';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Message } from '../../lib/database.types';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSenderHeader?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSenderHeader = !isOwn,
  showAvatar = !isOwn,
  showTimestamp = true,
  isLastInGroup = true,
}) => {
  const senderName = message.sender?.full_name || 'Engineer';
  const senderRole = message.sender?.role || 'member';
  const timeFormatted = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const roleLabel =
    senderRole === 'admin'
      ? 'Admin'
      : senderRole === 'head'
      ? 'Lead'
      : 'Engineer';

  const bubbleRadius = isOwn
    ? isLastInGroup ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'
    : isLastInGroup ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl';

  return (
    <div
      className={`flex items-end gap-2 ${
        isLastInGroup ? 'mb-3' : 'mb-1'
      } ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {!isOwn && (
        <div className="w-8 shrink-0 flex justify-center mb-0.5">
          {showAvatar ? (
            <ChromeAvatar
              name={senderName}
              role={senderRole}
              size="sm"
              className="flex-shrink-0"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name & Role Header (Incoming only, on first message of group) */}
        {!isOwn && showSenderHeader && (
          <div className="flex items-center gap-1.5 px-1 text-label font-sans">
            <span className="font-semibold text-cyber-primary">{senderName}</span>
            <span className="text-label capitalize px-1.5 py-0.2 rounded bg-cyber-surface-elevated border border-cyber-border text-accent-cyan font-medium">
              {roleLabel}
            </span>
          </div>
        )}

        {/* Message Bubble Surface */}
        <div
          className={`
            p-3 text-body-lg sm:text-sm font-sans leading-relaxed transition-all
            ${bubbleRadius}
            ${
              isOwn
                ? 'bg-accent-cyan/15 text-cyber-primary border border-accent-cyan/40 shadow-[0_1px_8px_rgba(0,217,255,0.12)] ml-auto'
                : 'bg-cyber-surface text-cyber-primary border border-cyber-border shadow-cyber-sm'
            }
          `}
        >
          {/* Text Content */}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {/* Optional Attachment Link */}
          {message.attachment_url && (
            <div className="mt-2 pt-2 border-t border-cyber-border">
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono underline font-medium text-accent-cyan hover:brightness-110"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{message.attachment_name || 'CAD / File Attachment'}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          )}

          {/* Timestamp footer in bubble (shown only on last bubble of group) */}
          {showTimestamp && (
            <div className="mt-1 text-label font-mono text-right select-none text-text-muted">
              {timeFormatted}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
