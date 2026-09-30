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

      <div className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Role Header (Incoming only) */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-mono">
            <span className="font-bold text-cyber-primary">{senderName}</span>
            <span className="text-[9px] uppercase px-1 rounded bg-cyber-surface-elevated border border-cyber-border text-accent-cyan font-bold">
              {senderRole}
            </span>
          </div>
        )}

        {/* Message Bubble Surface */}
        <div
          className={`
            p-3 rounded-lg text-xs sm:text-sm font-sans leading-relaxed transition-all shadow-cyber-sm
            ${
              isOwn
                ? 'bg-cyber-surface-elevated text-cyber-primary rounded-br-none border border-accent-cyan/40 shadow-[0_1px_8px_rgba(0,217,255,0.15)]'
                : 'bg-cyber-bg-alt text-cyber-primary rounded-bl-none border border-cyber-border'
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

          {/* Timestamp footer in bubble */}
          <div className="mt-1 text-[9px] font-mono text-right select-none text-cyber-muted">
            {timeFormatted}
          </div>
        </div>
      </div>
    </div>
  );
};
