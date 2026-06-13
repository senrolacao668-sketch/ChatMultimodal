// Barra de entrada — texto + anexos + envio

import React, { useState, useRef, useCallback } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AttachmentBlock } from './AttachmentBlock';
import type { Attachment, AttachmentType } from '@/types/engine';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function detectType(mime: string): AttachmentType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

interface Props {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFiles = useCallback((files: FileList) => {
    const newAtts: Attachment[] = Array.from(files).map(file => ({
      id: generateId(),
      name: file.name,
      type: detectType(file.type),
      mimeType: file.type,
      size: file.size,
      localUrl: URL.createObjectURL(file),
    }));
    setAttachments(prev => [...prev, ...newAtts]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const found = prev.find(a => a.id === id);
      if (found) URL.revokeObjectURL(found.localUrl);
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText('');
    setAttachments([]);
  }, [text, attachments, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      className="border-t border-border bg-card px-4 py-3 flex flex-col gap-2"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Pré-visualização dos anexos */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-1">
          {attachments.map(att => (
            <AttachmentBlock
              key={att.id}
              attachment={att}
              onRemove={() => removeAttachment(att.id)}
            />
          ))}
        </div>
      )}

      {/* Linha de entrada */}
      <div className="flex items-end gap-2">
        {/* Botão de anexo */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="shrink-0 h-12 w-12 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Input de arquivo oculto */}
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />

        {/* Campo de texto */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mensagem…"
          disabled={disabled}
          rows={1}
          className="flex-1 min-h-[48px] max-h-52 resize-none bg-input border-border text-foreground placeholder:text-muted-foreground text-base focus-visible:ring-primary focus-visible:ring-1 px-3 py-2.5"
        />

        {/* Botão de envio */}
        <Button
          type="button"
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          onClick={handleSend}
          className="shrink-0 h-12 w-12 bg-primary hover:bg-primary text-primary-foreground glow-primary transition-all"
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
