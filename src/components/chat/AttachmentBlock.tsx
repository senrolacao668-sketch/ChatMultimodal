// Componente de preview de anexo — bloco técnico retangular

import React from 'react';
import { FileText, Image, Video, Music, X } from 'lucide-react';
import type { Attachment } from '@/types/engine';

const ICONS = {
  image:    Image,
  video:    Video,
  audio:    Music,
  document: FileText,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface Props {
  attachment: Attachment;
  onRemove?: () => void;
  compact?: boolean;
}

export function AttachmentBlock({ attachment, onRemove, compact = false }: Props) {
  const Icon = ICONS[attachment.type];

  if (attachment.type === 'image' && attachment.localUrl && !compact) {
    return (
      <div className="relative group animate-fade-in">
        <div className="w-32 h-24 overflow-hidden border border-border bg-muted">
          <img
            src={attachment.localUrl}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-secondary border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-foreground" />
          </button>
        )}
        <p className="font-mono-tech text-muted-foreground mt-1 truncate max-w-[128px]">
          {attachment.name}
        </p>
      </div>
    );
  }

  return (
    <div className="relative group animate-fade-in flex items-center gap-2 bg-secondary border border-border px-3 py-2 min-w-0 max-w-xs">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-mono-tech text-foreground truncate">{attachment.name}</p>
        <p className="font-mono-tech text-muted-foreground">{formatBytes(attachment.size)}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
}
