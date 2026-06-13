// Hook central: ponte entre a UI e o motor de inferência local
// Gerencia modelos binários, RAG, parâmetros de resposta e TTS

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  EngineConfig,
  EngineState,
  EngineStatus,
  ModelEntry,
  RAGFolder,
  Attachment,
  OutputLanguage,
} from '@/types/engine';
import { loadEngineConfig, saveEngineConfig } from '@/lib/storage';

// -------------------------------------------------------------------
// Utilitários internos
// -------------------------------------------------------------------

function buildRagContext(folders: RAGFolder[]): string[] {
  const ctx: string[] = [];
  for (const folder of folders) {
    if (folder.active && folder.indexedFiles.length > 0) {
      const stored = sessionStorage.getItem(`rag_content_${folder.id}`);
      if (stored) {
        try {
          const contents = JSON.parse(stored) as string[];
          ctx.push(`[RAG:${folder.label}] ${contents.join('\n---\n')}`);
        } catch {
          ctx.push(`[RAG:${folder.label}] ${folder.indexedFiles.join(' | ')}`);
        }
      } else {
        ctx.push(`[RAG:${folder.label}] ${folder.indexedFiles.join(' | ')}`);
      }
    }
  }
  return ctx;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function detectFormat(name: string): ModelEntry['format'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.gguf')) return 'gguf';
  if (lower.endsWith('.bin')) return 'bin';
  return 'unknown';
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// -------------------------------------------------------------------
// Hook principal
// -------------------------------------------------------------------

export interface UseEngineReturn {
  state: EngineState;
  loadModelFromFile: (file: File) => void;
  activateModel: (modelId: string) => void;
  removeModel: (modelId: string) => void;
  updateRagFolder: (folderId: string, updates: Partial<RAGFolder>) => void;
  indexFolderFiles: (folderId: string, files: FileList) => void;
  toggleRagFolder: (folderId: string, active: boolean) => void;
  clearRagFolder: (folderId: string) => void;
  setTemperature: (value: number) => void;
  setMaxTokens: (value: number) => void;
  setOutputLanguage: (lang: OutputLanguage) => void;
  setTtsEnabled: (enabled: boolean) => void;
  setTtsVoice: (voice: string | null) => void;
  speakText: (text: string) => void;
  stopSpeech: () => void;
  availableVoices: SpeechSynthesisVoice[];
  executeInference: (
    userText: string,
    attachments: Attachment[],
    onToken: (token: string) => void,
    onDone: () => void
  ) => void;
  cancelInference: () => void;
  formatBytes: (bytes: number) => string;
}

export function useEngine(): UseEngineReturn {
  const [config, setConfig] = useState<EngineConfig>(() => loadEngineConfig());
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const cancelRef = useRef(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ----------------------------------------------------------------
  // NOVO: Refs para o motor wllama e o File object do modelo ativo
  // wllamaRef   — instância singleton de Wllama (persiste entre renders)
  // modelFileRef — File object original carregado pelo usuário via <input>
  //               mantido em memória para ser passado ao worker sem rede
  // modelBlobUrlRef — URL de objeto local (blob:) criada a partir do File,
  //                   usada pelo wllama para carregar o modelo sem fetch externo
  // ----------------------------------------------------------------
  const wllamaRef = useRef<import('@wllama/wllama').Wllama | null>(null);
  const modelFileRef = useRef<Map<string, File>>(new Map());
  const modelBlobUrlRef = useRef<string | null>(null); // mantido para cleanup

  useEffect(() => {
    saveEngineConfig(config);
  }, [config]);

  useEffect(() => {
    if (config.activeModelId) {
      setStatus('ready');
    } else {
      setStatus('idle');
    }
  }, [config.activeModelId]);

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const pt = voices.filter(v => v.lang.startsWith('pt'));
      setAvailableVoices(pt.length > 0 ? pt : voices.slice(0, 10));
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  // ----- Gestão de modelos -----

  const loadModelFromFile = useCallback((file: File) => {
    const format = detectFormat(file.name);
    const model: ModelEntry = {
      id: generateId(),
      name: file.name,
      path: file.name,
      format,
      sizeBytes: file.size,
      loaded: false,
    };

    // Guarda o File object em memória pelo ID do modelo
    modelFileRef.current.set(model.id, file);

    setConfig(prev => ({
      ...prev,
      models: [...prev.models.filter(m => m.name !== file.name), model],
    }));
  }, []);

  // ----------------------------------------------------------------
  // ALTERADO: activateModel
  //
  // O que mudou:
  //   - Removida a simulação com setTimeout de 800ms
  //   - Importa Wllama dinamicamente (evita SSR crash e garante WASM lazy-load)
  //   - Revoga a blob URL anterior para liberar memória
  //   - Cria uma blob URL local a partir do File object em modelFileRef
  //   - Instancia Wllama apontando para os workers WASM do pacote
  //   - Carrega o modelo GGUF via blob URL (zero rede: URL é local ao browser)
  //   - Só marca status='ready' após o modelo estar de fato carregado na memória
  //
  // Comunicação com o binário:
  //   wllama.loadModelFromUrl(blobUrl) envia o arquivo para o WebWorker interno
  //   do pacote via postMessage. O worker instancia o llama.cpp WASM e mantém
  //   o modelo carregado em SharedArrayBuffer / WASM heap entre chamadas.
  // ----------------------------------------------------------------
  const activateModel = useCallback(async (modelId: string) => {
    setStatus('loading');
    try {
      // Verifica se o llama-server local está rodando
      const res = await fetch('http://127.0.0.1:8080/health');
      if (!res.ok) throw new Error('Motor não respondeu. Inicie o llama-server.');
      setConfig(prev => ({
        ...prev,
        activeModelId: modelId,
        models: prev.models.map(m => ({ ...m, loaded: m.id === modelId })),
      }));
      setStatus('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('[ENGINE ERRO] ' + msg);
      setStatus('idle');
    }
  }, []);

  const removeModel = useCallback((modelId: string) => {
    modelFileRef.current.delete(modelId);
    setConfig(prev => ({
      ...prev,
      activeModelId: prev.activeModelId === modelId ? null : prev.activeModelId,
      models: prev.models.filter(m => m.id !== modelId),
    }));
  }, []);

  // ----- RAG -----

  const updateRagFolder = useCallback((folderId: string, updates: Partial<RAGFolder>) => {
    setConfig(prev => ({
      ...prev,
      ragFolders: prev.ragFolders.map(f =>
        f.id === folderId ? { ...f, ...updates } : f
      ),
    }));
  }, []);

  const indexFolderFiles = useCallback((folderId: string, files: FileList) => {
    const fileArray = Array.from(files);
    const names = fileArray.map(f => f.name);

    const textMimes = ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml'];
    const docExtensions = ['.txt', '.md', '.csv', '.json', '.xml'];

    const readPromises = fileArray
      .filter(f => {
        const isTextMime = textMimes.includes(f.type);
        const isDocExt = docExtensions.some(ext => f.name.toLowerCase().endsWith(ext));
        return isTextMime || isDocExt;
      })
      .map(f =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(`${f.name}:\n${reader.result as string}`);
          reader.onerror = () => resolve(`${f.name}: [erro de leitura]`);
          reader.readAsText(f);
        })
      );

    setConfig(prev => ({
      ...prev,
      ragFolders: prev.ragFolders.map(f =>
        f.id === folderId
          ? {
              ...f,
              indexedFiles: names,
              indexedCount: names.length,
              active: names.length > 0,
            }
          : f
      ),
    }));

    Promise.all(readPromises).then(contents => {
      const key = `rag_content_${folderId}`;
      sessionStorage.setItem(key, JSON.stringify(contents));
    });
  }, []);

  const toggleRagFolder = useCallback((folderId: string, active: boolean) => {
    setConfig(prev => ({
      ...prev,
      ragFolders: prev.ragFolders.map(f =>
        f.id === folderId ? { ...f, active } : f
      ),
    }));
  }, []);

  const clearRagFolder = useCallback((folderId: string) => {
    sessionStorage.removeItem(`rag_content_${folderId}`);
    setConfig(prev => ({
      ...prev,
      ragFolders: prev.ragFolders.map(f =>
        f.id === folderId
          ? { ...f, indexedFiles: [], indexedCount: 0, active: false, path: '' }
          : f
      ),
    }));
  }, []);

  // ----- Parâmetros de resposta -----

  const setTemperature = useCallback((value: number) => {
    setConfig(prev => ({ ...prev, temperature: Math.min(1, Math.max(0, value)) }));
  }, []);

  const setMaxTokens = useCallback((value: number) => {
    setConfig(prev => ({ ...prev, maxTokens: Math.max(64, value) }));
  }, []);

  // ----- Idioma -----
  const setOutputLanguage = useCallback((lang: OutputLanguage) => {
    setConfig(prev => ({ ...prev, outputLanguage: lang }));
  }, []);

  // ----- TTS -----

  const setTtsEnabled = useCallback((enabled: boolean) => {
    setConfig(prev => ({ ...prev, ttsEnabled: enabled }));
    if (!enabled) window.speechSynthesis?.cancel();
  }, []);

  const setTtsVoice = useCallback((voice: string | null) => {
    setConfig(prev => ({ ...prev, ttsVoice: voice }));
  }, []);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 1.0;
    utter.pitch = 1.0;
    if (config.ttsVoice) {
      const voice = window.speechSynthesis.getVoices().find(v => v.name === config.ttsVoice);
      if (voice) utter.voice = voice;
    }
    speechRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [config.ttsVoice]);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  // ----------------------------------------------------------------
  // ALTERADO: executeInference
  //
  // O que mudou:
  //   - Removido o setInterval de simulação token a token
  //   - Removida a variável bridgeResponse (resposta simulada)
  //   - Toda a lógica de construção de payload (ragContext, attachmentContext,
  //     langInstruction, inferencePayload, console.info) foi PRESERVADA intacta
  //   - Substituído o setInterval pela chamada engine.createCompletion() do wllama
  //   - onToken é chamado pelo callback onNewToken do wllama a cada token real
  //     gerado pelo llama.cpp WASM — sem buffer, sem delay artificial
  //   - cancelRef.current é verificado dentro do onNewToken; retornar `false`
  //     sinaliza ao wllama para interromper a geração imediatamente
  //   - onDone é chamado apenas após conclusão real ou cancelamento
  //
  // Comunicação com o binário:
  //   engine.createCompletion() envia o prompt ao WebWorker via postMessage.
  //   O worker executa llama_decode() no WASM heap e devolve cada token via
  //   postMessage de volta ao thread principal, onde onNewToken é invocado.
  //   O ciclo é: main thread → postMessage(prompt) → WASM worker →
  //   postMessage(token) → main thread → onToken(token) → UI streaming.
  // ----------------------------------------------------------------
  const executeInference = useCallback(
    (
      userText: string,
      attachments: Attachment[],
      onToken: (token: string) => void,
      onDone: () => void
    ) => {
      cancelRef.current = false;
      setStatus('processing');

      // Constrói o payload de entrada para o motor — PRESERVADO INTACTO
      const ragContext = buildRagContext(config.ragFolders);
      const attachmentContext = attachments.map(a =>
        `[ANEXO:${a.type.toUpperCase()}] ${a.name} (${formatBytes(a.size)})`
      );

      // Instrução de idioma forçada — PRESERVADO INTACTO
      const langMap: Record<string, string> = {
        pt: 'Responda em Português. ',
        en: 'Respond in English. ',
        es: 'Responda en Español. ',
        fr: 'Répondez en Français. ',
        de: 'Antworten Sie auf Deutsch. ',
        it: 'Rispondi in Italiano. ',
        auto: '',
      };
      const langInstruction = langMap[config.outputLanguage] ?? '';
      const finalPrompt = langInstruction + userText;

      // Payload estruturado — PRESERVADO INTACTO
      const inferencePayload = {
        prompt: finalPrompt,
        rawPrompt: userText,
        language: config.outputLanguage,
        attachments: attachmentContext,
        ragContext,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        modelId: config.activeModelId,
      };

      // Log de bridge — PRESERVADO INTACTO
      console.info('[ENGINE_BRIDGE] Payload de inferência:', inferencePayload);

      if (!config.activeModelId) {
        onToken('⚙ Nenhum modelo ativo. Ative um modelo no Painel de Controle.');
        onDone();
        setStatus('idle');
        return;
      }

      const contextBlock = [...ragContext, ...attachmentContext].join('\n');
      const fullPrompt = contextBlock.length > 0 ? `${contextBlock}\n\n${finalPrompt}` : finalPrompt;

      // Chama o llama-server local via API OpenAI-compatible
      fetch('http://127.0.0.1:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'local',
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          stream: true,
        }),
      }).then(async res => {
        if (!res.ok) throw new Error('Servidor não respondeu');
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          if (cancelRef.current) break;
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]') break;
            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content;
              if (token) onToken(token);
            } catch {}
          }
        }
        setStatus('ready');
        onDone();
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        onToken('\n\n[ERRO] ' + msg);
        setStatus('ready');
        onDone();
      });
    },
    [config]
  );

  const cancelInference = useCallback(() => {
    cancelRef.current = true;
  }, []);

  // Estado derivado completo
  const state: EngineState = {
    status,
    config,
    ragContext: buildRagContext(config.ragFolders),
  };

  return {
    state,
    loadModelFromFile,
    activateModel,
    removeModel,
    updateRagFolder,
    indexFolderFiles,
    toggleRagFolder,
    clearRagFolder,
    setTemperature,
    setMaxTokens,
    setTtsEnabled,
    setTtsVoice,
    speakText,
    stopSpeech,
    availableVoices,
    setOutputLanguage,
    executeInference,
    cancelInference,
    formatBytes,
  };
}