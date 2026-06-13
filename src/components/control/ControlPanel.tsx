// Painel de Controle — Sheet lateral com todas as seções da "Engrenagem"

import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ModelManager } from './ModelManager';
import { RAGControl } from './RAGControl';
import { ResponseControl } from './ResponseControl';
import { AudioSettings } from './AudioSettings';
import { LanguageSettings } from './LanguageSettings';
import { useEngineContext } from '@/contexts/AppContext';

// Seção colapsável do painel
function PanelSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between px-4 py-2.5 hover:bg-muted transition-colors"
      >
        <span className="font-mono-tech text-muted-foreground uppercase tracking-widest text-[11px]">
          {title}
        </span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
      <Separator className="bg-border" />
    </div>
  );
}

// Botão de trigger da engrenagem (usado no header do chat)
export function ControlPanelTrigger() {
  const engine = useEngineContext();
  const { status } = engine.state;
  const isActive = status === 'ready' || status === 'processing';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-9 w-9 border transition-colors ${
            isActive
              ? 'border-primary/40 text-primary hover:bg-muted hover:text-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Painel de Controle"
        >
          <Settings className={`w-4 h-4 ${isActive ? 'status-pulse' : ''}`} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[min(420px,100vw)] p-0 bg-card border-l border-border flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-foreground font-mono-tech text-sm uppercase tracking-widest">
            <Settings className="w-4 h-4 text-primary" />
            Painel de Controle
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            <PanelSection title="Gestor de Modelos" defaultOpen={true}>
              <ModelManager />
            </PanelSection>

            <PanelSection title="Controle de RAG" defaultOpen={true}>
              <RAGControl />
            </PanelSection>

            <PanelSection title="Idioma" defaultOpen={true}>
              <LanguageSettings />
            </PanelSection>

            <PanelSection title="Controle de Resposta" defaultOpen={true}>
              <ResponseControl />
            </PanelSection>

            <PanelSection title="Configurações de Áudio" defaultOpen={false}>
              <AudioSettings />
            </PanelSection>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
