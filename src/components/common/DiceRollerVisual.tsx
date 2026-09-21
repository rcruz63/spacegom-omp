import { useState, useEffect } from 'react';
import { Dices, Lock } from 'lucide-react';

interface DiceRollerVisualProps {
  diceCount: number; // 1, 2 o 3
  values: number[]; // valores actuales [d1, d2, ...]
  title: string;
  subtitle?: string;
  resultLabel?: string;
  resultValue?: string | number;
  allowManual?: boolean;
  canReroll?: boolean;
  blockedMessage?: string;
  onRollComplete: (newValues: number[]) => void;
  onManualChange?: (newValues: number[]) => void;
}

export function DiceRollerVisual({
  diceCount,
  values,
  title,
  subtitle,
  resultLabel,
  resultValue,
  allowManual = true,
  canReroll = true,
  blockedMessage = 'En este nivel de dificultad no está permitido relanzar los dados.',
  onRollComplete,
  onManualChange
}: DiceRollerVisualProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayedValues, setDisplayedValues] = useState<number[]>(values);
  const [isManualMode, setIsManualMode] = useState(false);
  const [hasRolledOnce, setHasRolledOnce] = useState(false);

  useEffect(() => {
    setDisplayedValues(values);
  }, [values]);

  const handleTriggerRoll = () => {
    if (!canReroll && hasRolledOnce) return;

    setIsRolling(true);
    let frames = 0;
    const maxFrames = 10;
    const interval = setInterval(() => {
      frames++;
      // Generar valores aleatorios durante la animación
      const randomValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDisplayedValues(randomValues);

      if (frames >= maxFrames) {
        clearInterval(interval);
        // Resultado final real
        const finalValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setDisplayedValues(finalValues);
        setIsRolling(false);
        setHasRolledOnce(true);
        onRollComplete(finalValues);
      }
    }, 50);
  };

  const handleManualDieChange = (index: number, val: number) => {
    const clamped = Math.max(1, Math.min(6, val));
    const next = [...displayedValues];
    next[index] = clamped;
    setDisplayedValues(next);
    if (onManualChange) {
      onManualChange(next);
    }
  };

  const isRerollBlocked = !canReroll && hasRolledOnce;

  return (
    <div className="p-4 bg-space-950 border border-space-800 rounded-xl space-y-3">
      {/* Header del tirador */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-slate-300 block">{title}</span>
          {subtitle && <span className="text-[10px] text-slate-500 block">{subtitle}</span>}
        </div>

        {allowManual && (
          <button
            type="button"
            onClick={() => setIsManualMode(!isManualMode)}
            className="text-[11px] text-space-accent hover:text-sky-300 underline font-semibold"
          >
            {isManualMode ? 'Modo Automático' : 'Introducir Dados Físicos'}
          </button>
        )}
      </div>

      {/* Dados Visuales */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {displayedValues.map((val, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              {isManualMode ? (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 mb-0.5">D{idx + 1}</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={val}
                    onChange={e => handleManualDieChange(idx, Number(e.target.value))}
                    className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-black text-slate-100 focus:border-space-accent focus:outline-none"
                  />
                </div>
              ) : (
                <div 
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br from-space-800 to-space-900 border-2 flex items-center justify-center text-xl font-black text-slate-100 shadow-lg transition-transform ${
                    isRolling ? 'animate-bounce border-space-accent scale-110' : 'border-space-600 scale-100'
                  }`}
                >
                  {val}
                </div>
              )}
            </div>
          ))}

          {/* Resultado combinado */}
          {resultLabel && (
            <div className="ml-2 pl-3 border-l border-space-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                {resultLabel}
              </span>
              <span className="text-lg font-black text-space-accent">
                {resultValue !== undefined ? resultValue : displayedValues.reduce((a, b) => a + b, 0)}
              </span>
            </div>
          )}
        </div>

        {/* Botón de Tirada en Automático */}
        {!isManualMode && (
          <div>
            {isRerollBlocked ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-space-900/80 rounded-lg border border-space-800 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tirada fijada</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriggerRoll}
                disabled={isRolling}
                className="flex items-center gap-2 px-3 py-2 bg-space-accent text-space-950 font-bold rounded-lg text-xs hover:bg-sky-400 transition-colors shadow disabled:opacity-50"
              >
                <Dices className="w-4 h-4" />
                <span>{hasRolledOnce ? 'Volver a Lanzar' : `Lanzar ${diceCount}D6`}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isRerollBlocked && (
        <p className="text-[10px] text-amber-400/90 italic flex items-center gap-1">
          <Lock className="w-3 h-3 shrink-0" />
          <span>{blockedMessage}</span>
        </p>
      )}
    </div>
  );
}
