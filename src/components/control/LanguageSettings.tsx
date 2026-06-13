// Seletor de idioma de saída do motor

import React from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEngineContext } from '@/contexts/AppContext';
import { LANGUAGE_LABELS, type OutputLanguage } from '@/types/engine';

export function LanguageSettings() {
  const engine = useEngineContext();
  const { config } = engine.state;

  const languages = Object.entries(LANGUAGE_LABELS) as [OutputLanguage, string][];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Idioma de Saída</span>
      </div>

      <Select
        value={config.outputLanguage}
        onValueChange={(v) => engine.setOutputLanguage(v as OutputLanguage)}
      >
        <SelectTrigger className="bg-input border-border text-foreground font-mono-tech h-9 text-sm">
          <SelectValue placeholder="Selecionar idioma" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {languages.map(([key, label]) => (
            <SelectItem key={key} value={key} className="font-mono-tech text-sm">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="font-mono-tech text-muted-foreground text-xs px-1">
        O motor receberá a instrução de idioma como prefixo do prompt a cada inferência.
      </p>
    </div>
  );
}
