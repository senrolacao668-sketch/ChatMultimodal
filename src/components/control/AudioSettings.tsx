// Configurações de Áudio — TTS com Web Speech API

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEngineContext } from '@/contexts/AppContext';

export function AudioSettings() {
  const engine = useEngineContext();
  const { config } = engine.state;
  const { availableVoices } = engine;

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        {config.ttsEnabled
          ? <Volume2 className="w-4 h-4 text-primary" />
          : <VolumeX className="w-4 h-4 text-muted-foreground" />
        }
        <span className="text-sm font-medium text-foreground">Configurações de Áudio</span>
      </div>

      {/* Toggle TTS */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-secondary border border-border">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">Síntese de Voz (TTS)</span>
          <span className="font-mono-tech text-muted-foreground">
            {config.ttsEnabled ? '● voz humana ativa' : '○ desativado'}
          </span>
        </div>
        <Switch
          checked={config.ttsEnabled}
          onCheckedChange={engine.setTtsEnabled}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Seleção de voz (apenas quando TTS ativo) */}
      {config.ttsEnabled && (
        <>
          {availableVoices.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-normal text-muted-foreground">Voz</label>
              <Select
                value={config.ttsVoice ?? 'default'}
                onValueChange={v => engine.setTtsVoice(v === 'default' ? null : v)}
              >
                <SelectTrigger className="bg-input border-border text-foreground font-mono-tech h-9 text-sm">
                  <SelectValue placeholder="Selecionar voz" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="default" className="font-mono-tech">
                    Padrão do sistema
                  </SelectItem>
                  {availableVoices.map(voice => (
                    <SelectItem key={voice.name} value={voice.name} className="font-mono-tech">
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="font-mono-tech text-muted-foreground px-1">
              Nenhuma voz disponível no sistema. O TTS utilizará a voz padrão do navegador.
            </p>
          )}

          {/* Teste de voz */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start h-8 px-3 border-border text-muted-foreground hover:text-primary hover:border-primary font-mono-tech text-xs"
            onClick={() => engine.speakText('Motor de voz ativo e operacional.')}
          >
            Testar voz
          </Button>
        </>
      )}

      {/* Info */}
      <p className="font-mono-tech text-muted-foreground text-xs px-1">
        Utiliza a Web Speech API do navegador. Respostas do assistente serão lidas automaticamente quando ativo.
      </p>
    </div>
  );
}
