// Gestor de Modelos — carrega e ativa binários .gguf/.bin

import React, { useRef } from 'react';
import { HardDrive, Upload, Play, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEngineContext } from '@/contexts/AppContext';
import type { ModelEntry } from '@/types/engine';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function ModelRow({ model, onActivate, onRemove }: {
  model: ModelEntry;
  onActivate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-secondary border border-border group">
      {/* Status */}
      <div className="shrink-0">
        {model.loaded
          ? <CheckCircle2 className="w-4 h-4 text-primary status-pulse" />
          : <Circle className="w-4 h-4 text-muted-foreground" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-mono-tech text-foreground truncate">{model.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="outline"
            className="font-mono-tech border-border text-muted-foreground text-[10px] px-1.5 py-0 uppercase"
          >
            {model.format}
          </Badge>
          <span className="font-mono-tech text-muted-foreground">{formatBytes(model.sizeBytes)}</span>
        </div>
      </div>

      {/* Ações */}
      <div className="shrink-0 flex items-center gap-1">
        {(
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted"
            onClick={onActivate}
            title="Ativar modelo"
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-muted "
          onClick={onRemove}
          title="Remover modelo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ModelManager() {
  const engine = useEngineContext();
  const { config, status } = engine.state;
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Gestor de Modelos</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'loading' && (
            <span className="font-mono-tech text-accent status-pulse">carregando…</span>
          )}
          {status === 'ready' && (
            <span className="font-mono-tech text-primary">● pronto</span>
          )}
          {status === 'idle' && (
            <span className="font-mono-tech text-muted-foreground">○ ocioso</span>
          )}
        </div>
      </div>

      {/* Botão de import */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary h-10 font-normal"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-4 h-4" />
        <span className="font-mono-tech">Importar .gguf / .bin</span>
      </Button>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".gguf,.bin"
        multiple
        onChange={e => {
          if (!e.target.files) return;
          Array.from(e.target.files).forEach(f => engine.loadModelFromFile(f));
          e.target.value = '';
        }}
      />

      {/* Lista de modelos */}
      {config.models.length === 0 ? (
        <div className="flex items-center justify-center py-6 border border-dashed border-border">
          <p className="font-mono-tech text-muted-foreground text-center">
            Nenhum modelo mapeado.<br />Importe um arquivo .gguf ou .bin.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {config.models.map(model => (
            <ModelRow
              key={model.id}
              model={model}
              onActivate={() => engine.activateModel(model.id)}
              onRemove={() => engine.removeModel(model.id)}
            />
          ))}
        </div>
      )}

      {config.activeModelId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted border border-primary/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono-tech text-primary text-xs truncate">
            Motor ativo: {config.models.find(m => m.id === config.activeModelId)?.name}
          </span>
        </div>
      )}
    </div>
  );
}
