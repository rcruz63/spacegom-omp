import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PlanetData } from '../../types/universe';
import { dockAtSpaceport, DockingResult } from '../../engine/spaceport';
import { rollDice, roll2D6 } from '../../engine/dice';
import { 
  Anchor, 
  Dices, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
interface SpaceportDockingModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  planet: PlanetData;
  onUpdateGame: (updated: GameSave) => void;
}

export function SpaceportDockingModal({
  isOpen,
  onClose,
  game,
  planet,
  onUpdateGame
}: SpaceportDockingModalProps) {
  const company = game.company;
  const dockingFee = planet.docking_price || 0;

  // Piloto
  const pilot = useMemo(() => {
    return company.employees.find(
      e => e.isActive && e.position.toLowerCase().includes('piloto')
    );
  }, [company.employees]);

  // Modificadores del piloto
  const pilotMods = useMemo(() => {
    let expMod = 0;
    let morMod = 0;
    if (pilot) {
      if (pilot.experience === 'veterano') expMod = 1;
      if (pilot.experience === 'novato') expMod = -1;
      if (pilot.morale === 'alta') morMod = 1;
      if (pilot.morale === 'baja') morMod = -1;
    }
    const shipMod = company.ship.diceModifier || 0;
    return {
      expMod,
      morMod,
      shipMod,
      totalMod: expMod + morMod + shipMod
    };
  }, [pilot, company.ship.diceModifier]);

  const [hasRolled, setHasRolled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualD1, setManualD1] = useState(4);
  const [manualD2, setManualD2] = useState(4);
  const [dockingResult, setDockingResult] = useState<DockingResult | null>(null);

  const handleRoll = (manualDice?: [number, number]) => {
    const rollRes = manualDice 
      ? roll2D6([], 'Amarre', manualDice) 
      : rollDice({ diceCount: 2 });

    const totalWithMods = rollRes.sum + pilotMods.totalMod;

    try {
      const res = dockAtSpaceport({
        company,
        planet,
        pilotRollTotal: totalWithMods,
        isDoubleSix: rollRes.isDoubleSix
      });

      setDockingResult(res);
      setHasRolled(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleConfirmAndClose = () => {
    if (!dockingResult) return;

    const newLogEntry = {
      id: `log_dock_${Date.now()}`,
      gameDate: game.date,
      category: 'nave' as const,
      action: 'Amarre en Espaciopuerto',
      details: dockingResult.logNotes.join(' | '),
      timestamp: new Date().toISOString()
    };

    onUpdateGame({
      ...game,
      company: dockingResult.nextCompany,
      universe: {
        ...game.universe,
        currentLocation: 'espaciopuerto'
      },
      auditLog: [newLogEntry, ...game.auditLog]
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-space-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Maniobra de Amarre en Espaciopuerto
              </h3>
              <p className="text-xs text-slate-400">
                Aproximación y amarre controlado en {planet.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-space-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Tasa y Calidad del Espaciopuerto */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-slate-400 block uppercase font-bold text-[11px] mb-0.5">Tasa de Amarre:</span>
              <span className="text-base font-black text-amber-300 font-mono">{dockingFee} SC</span>
            </div>
            <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-slate-400 block uppercase font-bold text-[11px] mb-0.5">Calidad / Tipo:</span>
              <span className="text-base font-black text-slate-100">{planet.spaceport_quality || 'MED'}</span>
            </div>
          </div>

          {/* Piloto y Modificadores */}
          {pilot ? (
            <div className="p-3.5 bg-space-950 border border-space-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Piloto: {pilot.name}
                </span>
                <span className="text-space-accent font-mono">
                  Mod: {pilotMods.totalMod >= 0 ? `+${pilotMods.totalMod}` : pilotMods.totalMod}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1 border-t border-space-800/80">
                <div>Experiencia ({pilot.experience}): <strong className="text-slate-200">{pilotMods.expMod >= 0 ? `+${pilotMods.expMod}` : pilotMods.expMod}</strong></div>
                <div>Moral ({pilot.morale}): <strong className="text-slate-200">{pilotMods.morMod >= 0 ? `+${pilotMods.morMod}` : pilotMods.morMod}</strong></div>
                <div>Modif. Nave: <strong className="text-slate-200">{pilotMods.shipMod}</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Sin piloto asignado: Se aplica modificador +0 a la maniobra de amarre.</span>
            </div>
          )}

          {/* Fase 1: Tirada */}
          {!hasRolled ? (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase">Tirada de Amarre (2D6):</span>
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
                      <label className="block text-[11px] text-slate-400 mb-1">Dado 1</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={manualD1}
                        onChange={e => setManualD1(Math.max(1, Math.min(6, Number(e.target.value))))}
                        className="w-16 bg-space-900 border border-space-700 rounded p-2 text-center text-lg font-bold text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Dado 2</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={manualD2}
                        onChange={e => setManualD2(Math.max(1, Math.min(6, Number(e.target.value))))}
                        className="w-16 bg-space-900 border border-space-700 rounded p-2 text-center text-lg font-bold text-slate-100"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoll([manualD1, manualD2])}
                    className="w-full py-2.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 text-xs"
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
                  <span>Efectuar Maniobra de Amarre (2D6)</span>
                </button>
              )}

              <p className="text-[11px] text-slate-500 text-center">
                Regla: 7 o más: amarre sin daños. 6 o menos: la nave sufre 1 daño leve (1-5 en 1D6) o 1 moderado (6 en 1D6).
              </p>
            </div>
          ) : (
            /* Fase 2: Resultado */
            <div className="space-y-4 pt-1">
              <div className={`p-4 rounded-xl border text-center space-y-2 ${
                dockingResult?.success 
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {dockingResult?.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                  )}
                  <h4 className="text-base font-black uppercase">
                    {dockingResult?.success ? '¡Amarre Perfecto sin Daños!' : `Fallo en Maniobra: Daño ${dockingResult?.damageSuffered?.toUpperCase()}`}
                  </h4>
                </div>

                <div className="text-xs space-y-1">
                  {dockingResult?.logNotes.map((note, idx) => (
                    <p key={idx} className="opacity-90">{note}</p>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
              >
                <span>Acceder a las Instalaciones del Espaciopuerto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
