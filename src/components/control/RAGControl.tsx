// Controle de RAG — mapeamento e indexação de pastas

import React, { useRef } from 'react';
import { Database, FolderOpen, ToggleLeft, ToggleRight, FileCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useEngineContext } from '@/contexts/AppContext';
import type { RAGFolder } from '@/types/engine';

const FOLDER_COLORS: Record<RAGFolder['type'], string> = {
  photos:    'text-chart-1',
  videos:    'text-chart-3',
  audios:    'text-chart-2',
  documents: 'text-chart-4',
  text:      'text-chart-5',
  custom:    'text-muted-foreground',
};

interface FolderRowProps {
  folder: RAGFolder;
  onIndex: (files: FileList) => void;
  onToggle: (active: boolean) => void;
  onClear: () => void;
}

function FolderRow({ folder, onIndex, onToggle, onClear }: FolderRowProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const colorClass = FOLDER_COLORS[folder.type];

  const getAccept = () => {
    switch (folder.type) {
      case 'photos': return 'image/*';
      case 'videos': return 'video/*';
      case 'audios': return 'audio/*';
      case 'documents': return '.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml';
      case 'text': return '.txt,.md,.csv,.json,.xml,.log,.cfg,.ini,.yaml,.yml';
      default: return '*';
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 bg-secondary border border-border group">
      {/* Linha principal */}
      <div className="flex items-center gap-2">
        <FolderOpen className={`w-4 h-4 shrink-0 ${colorClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{folder.label}</p>
        </div>

        {/* Toggle sem restrição */}
        <Switch
          checked={folder.active}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />

        {/* Lixeira individual */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-muted"
          onClick={onClear}
          title="Limpar base"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Status de indexação */}
      {folder.indexedCount > 0 ? (
        <div className="flex items-center gap-1.5 pl-6">
          <FileCheck className="w-3 h-3 text-primary" />
          <span className="font-mono-tech text-primary">
            {folder.indexedCount} arquivo{folder.indexedCount !== 1 ? 's' : ''} indexado{folder.indexedCount !== 1 ? 's' : ''}
          </span>
        </div>
      ) : null}

      {/* Botão de indexar */}
      <div className="pl-6 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-muted border border-border font-mono-tech"
          onClick={() => fileRef.current?.click()}
        >
          Selecionar arquivos
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept={getAccept()}
          onChange={e => {
            if (e.target.files) onIndex(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function RAGControl() {
  const engine = useEngineContext();
  const { config } = engine.state;

  const totalIndexed = config.ragFolders.reduce((acc, f) => acc + f.indexedCount, 0);
  const activeFolders = config.ragFolders.filter(f => f.active).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Controle de RAG</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-tech text-muted-foreground">
            {activeFolders} ativa{activeFolders !== 1 ? 's' : ''}
          </span>
          <span className="font-mono-tech text-primary">
            {totalIndexed} total
          </span>
        </div>
      </div>

      {/* Pastas */}
      <div className="flex flex-col gap-1.5">
        {config.ragFolders.map(folder => (
          <FolderRow
            key={folder.id}
            folder={folder}
            onIndex={files => engine.indexFolderFiles(folder.id, files)}
            onToggle={active => engine.toggleRagFolder(folder.id, active)}
            onClear={() => engine.clearRagFolder(folder.id)}
          />
        ))}
      </div>

      {/* Resumo de contexto ativo */}
      {activeFolders > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 border border-primary/30 bg-muted">
          <ToggleRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="font-mono-tech text-primary text-xs">
            Contexto RAG ativo em {activeFolders} fonte{activeFolders !== 1 ? 's' : ''}.
            O motor receberá estas referências em cada inferência.
          </p>
        </div>
      )}
      {activeFolders === 0 && (
        <div className="flex items-start gap-2 px-3 py-2 border border-border bg-muted">
          <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="font-mono-tech text-muted-foreground text-xs">
            RAG desativado. Selecione arquivos nas pastas acima.
          </p>
        </div>
      )}
    </div>
  );
}
