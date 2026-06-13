// Bolha de mensagem — usuário e assistente

import React from 'react';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/types/engine';
import { AttachmentBlock } from './AttachmentBlock';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 flex items-center justify-center border ${
        isUser
          ? 'bg-secondary border-border text-muted-foreground'
          : 'bg-primary border-primary text-primary-foreground'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Conteúdo */}
      <div className={`flex flex-col gap-2 max-w-[75%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Anexos (acima do texto para usuário) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {message.attachments.map(att => (
              <AttachmentBlock key={att.id} attachment={att} compact />
            ))}
          </div>
        )}

        {/* Texto */}
        {(message.text || message.streaming) && (
          <div className={`relative px-4 py-3 border ${
            isUser
              ? 'bg-secondary border-border text-foreground'
              : 'bg-card border-border text-foreground'
          }`}>
            {/* Linha lateral colorida para assistente */}
            {!isUser && (
              <span className="absolute left-0 top-0 h-full w-0.5 bg-primary" />
            )}
            <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
              message.streaming ? 'typing-cursor' : ''
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <span className="font-mono-tech text-muted-foreground px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
