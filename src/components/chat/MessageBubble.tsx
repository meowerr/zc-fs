import React from 'react';
import { ExternalLink, Paperclip } from 'lucide-react';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { Message } from '../../lib/database.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const senderName = message.sender?.full_name || 'Engineer';
  const senderRole = message.sender?.role || 'member';
  const timeFormatted = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-end gap-2.5 my-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <ChromeAvatar
          name={senderName}
          role={senderRole}
          size="sm"
          className="flex-shrink-0 mb-0.5"
        />
      )}

      <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Role Header (Incoming only) */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 px-1 text-xs">
            <span className="font-semibold text-cyber-primary">{senderName}</span>
            {senderRole !== 'member' && (
              <span className="text-2xs font-mono uppercase px-1.5 rounded bg-cyber-surface-elevated border border-cyber-border text-accent-cyan font-bold">
                {senderRole}
              </span>
            )}
          </div>
        )}

        {/* Message Bubble Surface */}
        <div
          className={`
            px-3.5 py-2.5 rounded-2xl text-sm font-sans leading-relaxed
            ${
              isOwn
                ? 'bg-accent-cyan/10 text-cyber-primary rounded-br-md border border-accent-cyan/35'
                : 'bg-cyber-surface-elevated text-cyber-primary rounded-bl-md border border-cyber-border'
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
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono underline font-medium text-accent-cyan hover:brightness-110"
              >
                <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="break-all">{message.attachment_name || 'Attachment'}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          )}

          {/* Timestamp footer in bubble */}
          <time dateTime={message.created_at} className="block mt-1 text-2xs font-mono text-right select-none text-cyber-muted">
            {isOwn && <span className="sr-only">You, </span>}
            {timeFormatted}
          </time>
        </div>
      </div>
    </div>
  );
};
