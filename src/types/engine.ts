// Tipos centrais do motor de inferência e sistema de chat

export type AttachmentType = 'image' | 'video' | 'audio' | 'document';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  size: number;
  /** URL.createObjectURL para preview local */
  localUrl: string;
  /** Conteúdo base64 ou texto extraído — alimenta o contexto do motor */
  content?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  /** Indica se a resposta ainda está sendo gerada */
  streaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ----- Configuração do Motor -----

export interface ModelEntry {
  id: string;
  name: string;
  path: string;
  format: 'gguf' | 'bin' | 'unknown';
  sizeBytes: number;
  loaded: boolean;
}

export interface RAGFolder {
  id: string;
  label: string;
  /** Caminho lógico mapeado pelo usuário */
  path: string;
  type: 'photos' | 'videos' | 'audios' | 'documents' | 'text' | 'custom';
  /** Número de itens indexados */
  indexedCount: number;
  active: boolean;
  /** Arquivos indexados como referência de contexto */
  indexedFiles: string[];
}

export interface EngineConfig {
  /** Modelo binário ativo */
  activeModelId: string | null;
  models: ModelEntry[];
  /** Pastas RAG mapeadas */
  ragFolders: RAGFolder[];
  /** 0.0 → determinístico | 1.0 → criativo */
  temperature: number;
  /** Limite máximo de tokens gerados */
  maxTokens: number;
  /** Síntese de voz ativa (TTS) */
  ttsEnabled: boolean;
  /** Voz selecionada para TTS */
  ttsVoice: string | null;
  /** Idioma de saída do motor */
  outputLanguage: OutputLanguage;
}

export type OutputLanguage = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'auto';

export const LANGUAGE_LABELS: Record<OutputLanguage, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  auto: 'Auto (detectar)',
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  activeModelId: null,
  models: [],
  ragFolders: [
    { id: 'rag-photos',    label: 'Fotos',      path: '', type: 'photos',    indexedCount: 0, active: false, indexedFiles: [] },
    { id: 'rag-videos',    label: 'Vídeos',     path: '', type: 'videos',    indexedCount: 0, active: false, indexedFiles: [] },
    { id: 'rag-audios',    label: 'Áudios',     path: '', type: 'audios',    indexedCount: 0, active: false, indexedFiles: [] },
    { id: 'rag-documents', label: 'Documentos', path: '', type: 'documents', indexedCount: 0, active: false, indexedFiles: [] },
    { id: 'rag-text',      label: 'Texto/Instruções', path: '', type: 'text', indexedCount: 0, active: false, indexedFiles: [] },
  ],
  temperature: 0.7,
  maxTokens: 2048,
  ttsEnabled: false,
  ttsVoice: null,
  outputLanguage: 'pt',
};

// ----- Estado de execução do motor -----

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'processing';

export interface EngineState {
  status: EngineStatus;
  config: EngineConfig;
  /** Fila de contexto RAG ativa para a próxima inferência */
  ragContext: string[];
}
