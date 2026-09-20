import { useState } from 'react';
import { DiceRollResult, DiceModifier } from '../types/common';
import { rollDice } from '../engine/dice';
import { Dices, Check, X } from 'lucide-react';

interface DiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRollComplete: (result: DiceRollResult) => void;
  defaultDiceCount?: number;
  modifiers?: DiceModifier[];
  reason?: string;
}

export function DiceModal({
  isOpen,
  onClose,
  onRollComplete,
  defaultDiceCount = 2,
  modifiers = [],
  reason = 'Tirada de dados'
}: DiceModalProps) {
  const [diceCount, setDiceCount] = useState(defaultDiceCount);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualValues, setManualValues] = useState<number[]>([3, 4]);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);

  if (!isOpen) return null;

  const handleRollAuto = () => {
    const res = rollDice({
      diceCount,
      modifiers,
      reason
    });
    setLastResult(res);
  };

  const handleRollManual = () => {
    const res = rollDice({
      diceCount,
      modifiers,
      manualRolls: manualValues.slice(0, diceCount),
      reason
    });
    setLastResult(res);
  };

  const handleConfirm = () => {
    if (lastResult) {
      onRollComplete(lastResult);
      setLastResult(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-space-800 border border-space-600 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-space-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-lg text-space-accent">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Módulo de Dados</h2>
              <p className="text-xs text-slate-400">{reason}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {modifiers.length > 0 && (
          <div className="mb-4 p-3 bg-space-900/60 border border-space-700 rounded-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Modificadores Aplicables:
            </span>
            <div className="flex flex-wrap gap-2">
              {modifiers.map((m, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2.5 py-1 rounded-md font-mono ${
                    m.value >= 0
                      ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-700 text-rose-300'
                  }`}
                >
                  {m.label}: {m.value >= 0 ? `+${m.value}` : m.value}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsManualMode(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
              !isManualMode
                ? 'bg-space-accent text-space-900 border-space-accent'
                : 'bg-space-900 text-slate-400 border-space-700 hover:text-slate-200'
            }`}
          >
            Tirada Automática (App)
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
              isManualMode
                ? 'bg-space-accent text-space-900 border-space-accent'
                : 'bg-space-900 text-slate-400 border-space-700 hover:text-slate-200'
            }`}
          >
            Tirada Manual (Tú en mesa)
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-slate-300">Número de dados:</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(count => (
              <button
                key={count}
                onClick={() => setDiceCount(count)}
                className={`px-3 py-1 text-xs font-bold rounded ${
                  diceCount === count
                    ? 'bg-space-600 text-slate-100 border border-space-accent'
                    : 'bg-space-900 text-slate-400 border border-space-700'
                }`}
              >
                {count}D6
              </button>
            ))}
          </div>
        </div>

        {isManualMode ? (
          <div className="mb-6 p-4 bg-space-900 border border-space-700 rounded-xl">
            <span className="text-xs text-slate-400 block mb-2">
              Introduce el resultado de los dados que has tirado en físico:
            </span>
            <div className="flex gap-3 justify-center">
              {Array.from({ length: diceCount }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <label className="text-[10px] text-slate-500 mb-1">Dado {i + 1}</label>
                  <select
                    value={manualValues[i] || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setManualValues(prev => {
                        const copy = [...prev];
                        copy[i] = val;
                        return copy;
                      });
                    }}
                    className="w-14 h-12 text-center text-lg font-bold bg-space-800 border border-space-600 rounded-lg text-slate-100"
                  >
                    {[1, 2, 3, 4, 5, 6].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={handleRollManual}
              className="w-full mt-4 py-2 bg-space-700 hover:bg-space-600 text-slate-200 text-xs font-bold rounded-lg transition-colors"
            >
              Registrar Resultado Manual
            </button>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <button
              onClick={handleRollAuto}
              className="w-full py-3 bg-space-accent hover:bg-sky-400 text-space-900 font-extrabold rounded-xl shadow-lg shadow-space-accent/20 transition-all flex items-center justify-center gap-2"
            >
              <Dices className="w-5 h-5" />
              <span>¡Lanzar {diceCount}D6!</span>
            </button>
          </div>
        )}

        {lastResult && (
          <div className="p-4 bg-space-900/90 border border-space-600 rounded-xl mb-4 text-center">
            <div className="flex justify-center gap-2 mb-2">
              {lastResult.rolls.map((r, i) => (
                <span
                  key={i}
                  className="w-10 h-10 flex items-center justify-center bg-space-700 border border-space-500 text-slate-100 font-bold text-lg rounded-lg shadow"
                >
                  {r}
                </span>
              ))}
            </div>
            <div className="text-sm font-medium text-slate-300">
              Suma: <span className="font-bold text-slate-100">{lastResult.sum}</span>
              {lastResult.modifiers.length > 0 && (
                <span className="text-xs text-slate-400">
                  {' '} + mods ({lastResult.modifiers.reduce((s, m) => s + m.value, 0)}) ={' '}
                  <span className="font-bold text-space-accent text-base">{lastResult.total}</span>
                </span>
              )}
            </div>
            {lastResult.isDoubleSix && (
              <p className="text-xs font-bold text-amber-400 mt-1">¡Doble 6 natural! (Aumento de experiencia)</p>
            )}
            {lastResult.isNaturalSnakeEyes && (
              <p className="text-xs font-bold text-rose-400 mt-1">¡Doble 1 natural!</p>
            )}

            <button
              onClick={handleConfirm}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Aceptar y Aplicar Tirada</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
