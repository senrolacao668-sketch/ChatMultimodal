// Página principal — Interface de Chat

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageSquare, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { InputBar } from '@/components/chat/InputBar';
import { SessionSidebar } from '@/components/chat/SessionSidebar';
import { ControlPanelTrigger } from '@/components/control/ControlPanel';
import { useEngineContext, useChatContext } from '@/contexts/AppContext';
import type { Attachment } from '@/types/engine';

// Indicador de estado do motor no header
function EngineStatusBadge() {
  const engine = useEngineContext();
  const { status, config } = engine.state;

  const modelName = config.models.find(m => m.id === config.activeModelId)?.name;

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        status === 'ready'      ? 'bg-primary status-pulse' :
        status === 'processing' ? 'bg-accent status-pulse' :
        status === 'loading'    ? 'bg-accent status-pulse' :
        'bg-muted-foreground'
      }`} />
      <span className="font-mono-tech text-muted-foreground truncate max-w-[180px]">
        {status === 'idle'       ? 'sem modelo' :
         status === 'loading'    ? 'carregando…' :
         status === 'ready'      ? (modelName ?? 'pronto') :
         status === 'processing' ? 'processando…' : ''}
      </span>
    </div>
  );
}

// Estado vazio do chat
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-16 px-8">
      <div className="w-16 h-16 border border-primary/30 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-primary/60" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-base font-medium text-foreground text-balance mb-2">
          Motor pronto para receber entrada
        </h2>
        <p className="font-mono-tech text-muted-foreground text-sm text-pretty">
          Digite uma mensagem ou anexe um arquivo para iniciar a inferência.
          Configure o modelo no painel de controle (⚙).
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const engine = useEngineContext();
  const chat = useChatContext();
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messages = chat.currentSession?.messages ?? [];
  const isProcessing = engine.state.status === 'processing';

  // Auto-scroll para a última mensagem
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    (text: string, attachments: Attachment[]) => {
      if (isProcessing) return;

      // 1. Adiciona mensagem do usuário
      chat.addUserMessage(text, attachments);

      // 2. Prepara bolha do assistente (streaming)
      const assistantId = chat.appendAssistantMessage();

      // 3. Dispara bridge de execução
      engine.executeInference(
        text,
        attachments,
        (token) => {
          chat.appendToken(assistantId, token);
        },
        () => {
          chat.finalizeAssistantMessage(assistantId);
          // TTS: fala a resposta finalizada se ativo
          if (engine.state.config.ttsEnabled) {
            const session = chat.sessions.find(s => s.id === chat.currentSessionId);
            const msg = session?.messages.find(m => m.id === assistantId);
            if (msg?.text) engine.speakText(msg.text);
          }
        }
      );
    },
    [chat, engine, isProcessing]
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* Sidebar desktop */}
      <div className="hidden lg:flex shrink-0">
        <SessionSidebar />
      </div>

      {/* Sidebar mobile — Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
          <SessionSidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Área principal do chat */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ height: '100dvh' }}>

        {/* Header */}
        <header className="shrink-0 flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-border bg-card">
          {/* Botão menu mobile */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>

          {/* Título + status */}
          <div className="flex-1 min-w-0 flex flex-col gap-0">
            <h1 className="text-sm font-medium text-foreground truncate leading-tight">
              {chat.currentSession?.title ?? 'Chat'}
            </h1>
            <EngineStatusBadge />
          </div>

          {/* Engrenagem */}
          <ControlPanelTrigger />
        </header>

        {/* Área de mensagens */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-2 sm:px-4 py-4 sm:py-6 flex flex-col gap-3 sm:gap-4 max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}
            <div ref={scrollEndRef} />
          </div>
        </ScrollArea>

        {/* Barra de entrada */}
        <div className="shrink-0">
          <InputBar onSend={handleSend} disabled={isProcessing} />
        </div>
      </div>
    </div>
  );
}
