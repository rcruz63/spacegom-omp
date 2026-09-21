import { useState, useMemo } from 'react';
import { GameEvent } from '../types/events';
import { GameSave } from '../types/game';
import { resolveHiringEvent, ResolveHiringResult } from '../engine/hiring';
import { 
  Dices, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface EventResolutionModalProps {
  event: GameEvent;
  game: GameSave;
  onResolved: (updatedGame: GameSave) => void;
}

export function EventResolutionModal({
  event,
  game,
  onResolved
}: EventResolutionModalProps) {
  const isHiring = event.type === 'hire_resolution';
  const hireData = event.data as {
    positionKey: string;
    experience: string;
    candidateName: string;
    monthlySalary: number;
    hireThreshold: number;
  } | undefined;

  const director = useMemo(() => {
    return game.company.employees.find(e => e.id === event.assignedEmployeeId) ||
           game.company.employees.find(e => e.isActive && e.position.toLowerCase().includes('director gerente'));
  }, [game.company.employees, event.assignedEmployeeId]);

  // Modificadores del Director
  const directorMods = useMemo(() => {
    let expMod = 0;
    let morMod = 0;
    if (director) {
      if (director.experience === 'veterano') expMod = 1;
      if (director.experience === 'novato') expMod = -1;
      if (director.morale === 'alta') morMod = 1;
      if (director.morale === 'baja') morMod = -1;
    }
    const repMod = Math.floor(game.company.reputation / 2);
    return {
      expMod,
      morMod,
      repMod,
      totalMod: expMod + morMod + repMod
    };
  }, [director, game.company.reputation]);

  const [hasRolled, setHasRolled] = useState(false);
  const [manualD1, setManualD1] = useState(4);
  const [manualD2, setManualD2] = useState(4);
  const [isManualMode, setIsManualMode] = useState(false);

  const [resolutionResult, setResolutionResult] = useState<ResolveHiringResult | null>(null);

  const handleRoll = (manualDice?: [number, number]) => {
    if (!isHiring) return;
    const res = resolveHiringEvent(game, event, manualDice);
    setResolutionResult(res);
    setHasRolled(true);
  };

  const handleConfirmAndClose = () => {
    if (resolutionResult) {
      onResolved(resolutionResult.nextGame);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-space-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Resolución de Evento: {event.title}
              </h3>
              <p className="text-xs text-slate-400">
                Llegada a la fecha objetivo de la tarea programada
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Tarjeta de Candidato / Puesto */}
          {hireData && (
            <div className="p-4 bg-space-950 border border-space-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase">Puesto a Cubrir:</span>
                <span className="text-sm font-bold text-slate-100">{hireData.positionKey}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase">Candidato Encontrado:</span>
                <span className="font-semibold text-space-accent">{hireData.candidateName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase">Nivel de Experiencia:</span>
                <span className="capitalize font-medium text-slate-300">{hireData.experience}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase">Salario Negociado:</span>
                <span className="font-bold text-amber-300 font-mono">{hireData.monthlySalary} SC / mes</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-space-800">
                <span className="text-slate-400 font-semibold uppercase">Dificultad de Contratación:</span>
                <span className="font-black text-rose-400 text-sm">Igualar o superar {hireData.hireThreshold}+</span>
              </div>
            </div>
          )}

          {/* Desglose de Modificadores del Director Gerente */}
          {director && (
            <div className="p-3.5 bg-space-950/60 border border-space-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Negociador: {director.name} (Director Gerente)
                </span>
                <span className="text-space-accent font-mono">
                  Modificador Total: {directorMods.totalMod >= 0 ? `+${directorMods.totalMod}` : directorMods.totalMod}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1 border-t border-space-800/80">
                <div>
                  Experiencia ({director.experience}): <strong className="text-slate-200">{directorMods.expMod >= 0 ? `+${directorMods.expMod}` : directorMods.expMod}</strong>
                </div>
                <div>
                  Moral ({director.morale}): <strong className="text-slate-200">{directorMods.morMod >= 0 ? `+${directorMods.morMod}` : directorMods.morMod}</strong>
                </div>
                <div>
                  Reputación/2: <strong className="text-slate-200">{directorMods.repMod >= 0 ? `+${directorMods.repMod}` : directorMods.repMod}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Fase de Tirada de Dados */}
          {!hasRolled ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase">Tirada de Contratación (2D6):</span>
                <button
                  type="button"
                  onClick={() => setIsManualMode(!isManualMode)}
                  className="text-space-accent hover:text-sky-300 underline font-semibold"
                >
                  {isManualMode ? 'Modo Automático' : 'Introducir Dados Manuales'}
                </button>
              </div>

              {isManualMode ? (
                <div className="p-4 bg-space-950 border border-space-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Dado 1 (1-6)</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={manualD1}
                        onChange={e => setManualD1(Math.max(1, Math.min(6, Number(e.target.value))))}
                        className="w-16 bg-space-900 border border-space-700 rounded-lg p-2 text-center text-lg font-bold text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Dado 2 (1-6)</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={manualD2}
                        onChange={e => setManualD2(Math.max(1, Math.min(6, Number(e.target.value))))}
                        className="w-16 bg-space-900 border border-space-700 rounded-lg p-2 text-center text-lg font-bold text-slate-100"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoll([manualD1, manualD2])}
                    className="w-full py-2.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 transition-colors text-xs"
                  >
                    Resolver con Dados [{manualD1}, {manualD2}]
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRoll()}
                  className="w-full py-3 bg-space-accent text-space-950 font-bold rounded-xl hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-space-accent/15 text-sm"
                >
                  <Dices className="w-5 h-5" />
                  <span>Lanzar 2D6 y Resolver Contratación</span>
                </button>
              )}
            </div>
          ) : (
            /* Resultado de la Tirada */
            <div className="space-y-4 pt-2">
              <div className={`p-5 rounded-xl border text-center space-y-3 ${
                resolutionResult?.success 
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {resolutionResult?.success ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-400" />
                  )}
                  <h4 className="text-xl font-black uppercase">
                    {resolutionResult?.success ? '¡Contratación Exitosa!' : 'Contratación Fallida'}
                  </h4>
                </div>

                <div className="flex items-center justify-center gap-4 text-sm font-bold">
                  <span>Dados: <strong>{resolutionResult?.diceRollSum}</strong></span>
                  <span>+ Mod: <strong>{directorMods.totalMod}</strong></span>
                  <span className="text-base text-slate-100">
                    = Total: <strong className={resolutionResult?.success ? 'text-emerald-400 text-xl' : 'text-rose-400 text-xl'}>{resolutionResult?.rollTotal}</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    (Objetivo: {resolutionResult?.hireThreshold}+)
                  </span>
                </div>

                <p className="text-xs max-w-md mx-auto leading-relaxed">
                  {resolutionResult?.success
                    ? `${hireData?.candidateName} ha aceptado la oferta y se incorpora formalmente a la plantilla de ${hireData?.positionKey}.`
                    : `El candidato ${hireData?.candidateName} ha rechazado la propuesta de trabajo o no superó los estándares.`}
                </p>
              </div>

              {/* Cambios de Moral / Experiencia del Director */}
              {resolutionResult?.logNotes && resolutionResult.logNotes.length > 0 && (
                <div className="p-3 bg-space-950 border border-space-800 rounded-xl text-xs space-y-1 text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-0.5">Consecuencias en la tripulación:</span>
                  {resolutionResult.logNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmAndClose}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow"
              >
                <span>Continuar Partida</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
