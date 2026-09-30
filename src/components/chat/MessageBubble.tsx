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
          className="flex-shrink-0 mb-1"
        />
      )}

      <div className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Role Header (Incoming only) */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-mono">
            <span className="font-bold text-chrome-900 dark:text-white">{senderName}</span>
            <span className="text-[9px] uppercase px-1 rounded bg-black/5 dark:bg-white/10 text-telemetry-blue dark:text-telemetry-aqua font-bold">
              {senderRole}
            </span>
          </div>
        )}

        {/* Message Bubble Glass Surface */}
        <div
          className={`
            p-3.5 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed backdrop-blur-md transition-all shadow-sm
            ${
              isOwn
                ? 'bg-gradient-to-r from-telemetry-blue to-[#1F50C9] text-white rounded-br-none border-t border-white/40 shadow-neon-blue/20'
                : 'bg-white/75 dark:bg-midnight-850/70 text-chrome-900 dark:text-white rounded-bl-none border border-chrome-300/80 dark:border-white/10'
            }
          `}
        >
          {/* Text Content */}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {/* Optional Attachment Link */}
          {message.attachment_url && (
            <div className="mt-2 pt-2 border-t border-white/20 dark:border-white/10">
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noreferrer"
                className={`
                  inline-flex items-center gap-1.5 text-xs font-mono underline font-medium
                  ${isOwn ? 'text-white/90 hover:text-white' : 'text-telemetry-blue dark:text-telemetry-aqua'}
                `}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{message.attachment_name || 'CAD / File Attachment'}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          )}

          {/* Timestamp footer in bubble */}
          <div
            className={`
              mt-1 text-[9px] font-mono text-right select-none
              ${isOwn ? 'text-white/60' : 'text-chrome-900/40 dark:text-white/40'}
            `}
          >
            {timeFormatted}
          </div>
        </div>
      </div>
    </div>
  );
};
