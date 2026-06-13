// Hook de gestão de sessões e mensagens do chat

import { useState, useCallback } from 'react';
import type { ChatSession, Message, Attachment } from '@/types/engine';
import {
  loadSessions,
  saveSessions,
  loadCurrentSessionId,
  saveCurrentSessionId,
} from '@/lib/storage';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createSession(): ChatSession {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'Nova Conversa',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function deriveTitle(text: string): string {
  const trimmed = text.trim().slice(0, 40);
  return trimmed.length < text.trim().length ? `${trimmed}…` : trimmed;
}

export interface UseChatSessionsReturn {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  currentSessionId: string | null;
  // Sessões
  createNewSession: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  clearCurrentSession: () => void;
  // Mensagens
  addUserMessage: (text: string, attachments: Attachment[]) => Message;
  appendAssistantMessage: () => string;
  appendToken: (messageId: string, token: string) => void;
  finalizeAssistantMessage: (messageId: string) => void;
}

export function useChatSessions(): UseChatSessionsReturn {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = loadSessions();
    return stored.length > 0 ? stored : [createSession()];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const stored = loadCurrentSessionId();
    const existingSessions = loadSessions();
    if (stored && existingSessions.find(s => s.id === stored)) return stored;
    return existingSessions[0]?.id ?? null;
  });

  const currentSession = sessions.find(s => s.id === currentSessionId) ?? sessions[0] ?? null;

  // Persiste sessões
  const persist = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    saveSessions(updated);
  }, []);

  const createNewSession = useCallback(() => {
    const session = createSession();
    const updated = [session, ...sessions];
    persist(updated);
    setCurrentSessionId(session.id);
    saveCurrentSessionId(session.id);
  }, [sessions, persist]);

  const selectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    saveCurrentSessionId(id);
  }, []);

  const deleteSession = useCallback((id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    const next = updated.length > 0 ? updated : [createSession()];
    persist(next);
    if (currentSessionId === id) {
      setCurrentSessionId(next[0].id);
      saveCurrentSessionId(next[0].id);
    }
  }, [sessions, currentSessionId, persist]);

  const clearCurrentSession = useCallback(() => {
    if (!currentSessionId) return;
    const updated = sessions.map(s =>
      s.id === currentSessionId
        ? { ...s, messages: [], updatedAt: Date.now(), title: 'Nova Conversa' }
        : s
    );
    persist(updated);
  }, [sessions, currentSessionId, persist]);

  // ----- Mensagens -----

  const addUserMessage = useCallback(
    (text: string, attachments: Attachment[]): Message => {
      const msg: Message = {
        id: generateId(),
        role: 'user',
        text,
        attachments,
        timestamp: Date.now(),
      };
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id !== currentSessionId) return s;
          const isFirst = s.messages.length === 0;
          return {
            ...s,
            messages: [...s.messages, msg],
            updatedAt: Date.now(),
            title: isFirst ? deriveTitle(text) : s.title,
          };
        });
        saveSessions(updated);
        return updated;
      });
      return msg;
    },
    [currentSessionId]
  );

  const appendAssistantMessage = useCallback((): string => {
    const id = generateId();
    const msg: Message = {
      id,
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      streaming: true,
    };
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === currentSessionId
          ? { ...s, messages: [...s.messages, msg], updatedAt: Date.now() }
          : s
      );
      saveSessions(updated);
      return updated;
    });
    return id;
  }, [currentSessionId]);

  const appendToken = useCallback((messageId: string, token: string) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== currentSessionId) return s;
        return {
          ...s,
          messages: s.messages.map(m =>
            m.id === messageId ? { ...m, text: m.text + token } : m
          ),
        };
      });
      return updated;
    });
  }, [currentSessionId]);

  const finalizeAssistantMessage = useCallback((messageId: string) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== currentSessionId) return s;
        return {
          ...s,
          messages: s.messages.map(m =>
            m.id === messageId ? { ...m, streaming: false } : m
          ),
          updatedAt: Date.now(),
        };
      });
      saveSessions(updated);
      return updated;
    });
  }, [currentSessionId]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    clearCurrentSession,
    addUserMessage,
    appendAssistantMessage,
    appendToken,
    finalizeAssistantMessage,
  };
}
