// Sidebar de sessões — histórico, nova conversa, excluir sessão

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useChatContext } from '@/contexts/AppContext';
import type { ChatSession } from '@/types/engine';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

interface SessionItemProps {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SessionItem({ session, active, onSelect, onDelete }: SessionItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full text-left flex items-center gap-2 px-3 py-2.5 transition-colors group ${
        active
          ? 'bg-muted border-l-2 border-primary text-foreground'
          : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-primary' : ''}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{session.title}</p>
        <p className="font-mono-tech text-muted-foreground">{formatDate(session.updatedAt)}</p>
      </div>
      {(hovered || active) && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </button>
  );
}

interface Props {
  onClose?: () => void;
}

export function SessionSidebar({ onClose }: Props) {
  const chat = useChatContext();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    chat.deleteSession(id);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64 shrink-0">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border shrink-0">
        <span className="font-mono-tech text-sidebar-foreground uppercase tracking-widest text-xs">
          Sessões
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={chat.createNewSession}
            title="Nova conversa"
          >
            <Plus className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lista de sessões */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {chat.sessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              active={session.id === chat.currentSessionId}
              onSelect={() => {
                chat.selectSession(session.id);
                onClose?.();
              }}
              onDelete={() => setDeleteTarget(session.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Rodapé — limpar sessão atual */}
      <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2 h-8 text-muted-foreground hover:text-destructive hover:bg-muted font-normal text-xs"
          onClick={chat.clearCurrentSession}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar conversa atual
        </Button>
      </div>

      {/* Confirmação de exclusão */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir sessão?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta conversa será removida permanentemente do histórico local.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-secondary text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
