// Controle de Resposta — temperatura e max tokens

import React from 'react';
import { Sliders } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useEngineContext } from '@/contexts/AppContext';

export function ResponseControl() {
  const engine = useEngineContext();
  const { config } = engine.state;

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <Sliders className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Controle de Resposta</span>
      </div>

      {/* Temperatura */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-normal text-muted-foreground">
            Temperatura
            <span className="ml-2 font-mono-tech text-foreground">{config.temperature.toFixed(2)}</span>
          </label>
          <span className="font-mono-tech text-muted-foreground text-[10px]">
            {config.temperature < 0.3 ? 'determinístico' : config.temperature > 0.7 ? 'criativo' : 'balanceado'}
          </span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[config.temperature]}
          onValueChange={([v]) => engine.setTemperature(v)}
          className="[&_.bg-primary\/20]:bg-border [&_.bg-primary]:bg-primary [&_[class*=Thumb]]:border-primary [&_[class*=Thumb]]:bg-primary"
        />
        <div className="flex justify-between">
          <span className="font-mono-tech text-muted-foreground">0.00</span>
          <span className="font-mono-tech text-muted-foreground">1.00</span>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-border" />

      {/* Max Tokens */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-normal text-muted-foreground">
            Max Tokens
            <span className="ml-2 font-mono-tech text-foreground">{config.maxTokens}</span>
          </label>
          <span className="font-mono-tech text-muted-foreground text-[10px]">
            {config.maxTokens <= 512 ? 'curto' : config.maxTokens <= 2048 ? 'médio' : 'longo'}
          </span>
        </div>
        <Slider
          min={64}
          max={8192}
          step={64}
          value={[config.maxTokens]}
          onValueChange={([v]) => engine.setMaxTokens(v)}
          className="[&_.bg-primary\/20]:bg-border [&_.bg-primary]:bg-primary [&_[class*=Thumb]]:border-primary [&_[class*=Thumb]]:bg-primary"
        />
        <div className="flex justify-between">
          <span className="font-mono-tech text-muted-foreground">64</span>
          <span className="font-mono-tech text-muted-foreground">8192</span>
        </div>
      </div>
    </div>
  );
}
