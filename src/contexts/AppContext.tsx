// Contexto global do motor e do chat — provider raiz da aplicação

import React, { createContext, useContext, type ReactNode } from 'react';
import { useEngine, type UseEngineReturn } from '@/hooks/useEngine';
import { useChatSessions, type UseChatSessionsReturn } from '@/hooks/useChatSessions';

// ----- Engine Context -----
const EngineContext = createContext<UseEngineReturn | null>(null);

export function useEngineContext(): UseEngineReturn {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngineContext deve ser usado dentro de AppProvider');
  return ctx;
}

// ----- Chat Context -----
const ChatContext = createContext<UseChatSessionsReturn | null>(null);

export function useChatContext(): UseChatSessionsReturn {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext deve ser usado dentro de AppProvider');
  return ctx;
}

// ----- Provider raiz -----
export function AppProvider({ children }: { children: ReactNode }) {
  const engine = useEngine();
  const chat = useChatSessions();

  return (
    <EngineContext.Provider value={engine}>
      <ChatContext.Provider value={chat}>
        {children}
      </ChatContext.Provider>
    </EngineContext.Provider>
  );
}
