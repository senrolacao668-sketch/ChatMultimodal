// Camada de persistência local — LocalStorage tipado

import type { ChatSession, EngineConfig } from '@/types/engine';
import { DEFAULT_ENGINE_CONFIG } from '@/types/engine';

const KEYS = {
  SESSIONS: 'chat_sessions',
  CURRENT_SESSION: 'current_session_id',
  ENGINE_CONFIG: 'engine_config',
} as const;

// ----- Sessões de Chat -----

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(KEYS.SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export function loadCurrentSessionId(): string | null {
  return localStorage.getItem(KEYS.CURRENT_SESSION);
}

export function saveCurrentSessionId(id: string | null): void {
  if (id) localStorage.setItem(KEYS.CURRENT_SESSION, id);
  else localStorage.removeItem(KEYS.CURRENT_SESSION);
}

// ----- Configuração do Motor -----

export function loadEngineConfig(): EngineConfig {
  try {
    const raw = localStorage.getItem(KEYS.ENGINE_CONFIG);
    if (!raw) return { ...DEFAULT_ENGINE_CONFIG };
    const parsed = JSON.parse(raw) as Partial<EngineConfig>;
    // Mescla com padrão para garantir completude após atualizações de schema
    return {
      ...DEFAULT_ENGINE_CONFIG,
      ...parsed,
      ragFolders: parsed.ragFolders ?? DEFAULT_ENGINE_CONFIG.ragFolders,
    };
  } catch {
    return { ...DEFAULT_ENGINE_CONFIG };
  }
}

export function saveEngineConfig(config: EngineConfig): void {
  localStorage.setItem(KEYS.ENGINE_CONFIG, JSON.stringify(config));
}
