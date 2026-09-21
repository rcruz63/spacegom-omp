import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PlanetData } from '../../types/universe';
import { refuelShip, RefuelResult } from '../../engine/spaceport';
import { advanceDays } from '../../engine/calendar';
import { rollDice, roll2D6 } from '../../engine/dice';
import { 
  Fuel, 
  Dices, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';

interface SpaceportRefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  planet: PlanetData;
  onUpdateGame: (updated: GameSave) => void;
}

export function SpaceportRefuelModal({
  isOpen,
  onClose,
  game,
  planet,
  onUpdateGame
}: SpaceportRefuelModalProps) {
  const company = game.company;
  const ship = company.ship;
  const neededFuel = Math.max(0, ship.fuelMax - ship.fuelCurrent);

  // Técnico de repostaje y análisis
  const fuelTech = useMemo(() => {
    return company.employees.find(
      e => e.isActive && e.position.toLowerCase().includes('repostaje')
    );
  }, [company.employees]);

  // Modificadores del técnico
  const techMods = useMemo(() => {
    let expMod = 0;
    let morMod = 0;
    if (fuelTech) {
      if (fuelTech.experience === 'veterano') expMod = 1;
      if (fuelTech.experience === 'novato') expMod = -1;
      if (fuelTech.morale === 'alta') morMod = 1;
      if (fuelTech.morale === 'baja') morMod = -1;
    }
    return {
      expMod,
      morMod,
      totalMod: expMod + morMod
    };
  }, [fuelTech]);

  const [unitsToRefuel, setUnitsToRefuel] = useState<number>(() => Math.min(10, neededFuel));

  // Densidad y velocidad de bombeo
  const density = (planet.fuel_density || 'DM').toUpperCase().trim();
  let unitsPerDay = 5;
  if (density.includes('DA') || density.includes('ALTA')) unitsPerDay = 10;
  if (density.includes('DB') || density.includes('BAJA')) unitsPerDay = 1;

  const daysTaken = Math.max(1, Math.ceil(unitsToRefuel / unitsPerDay));
  const fuelCost = unitsToRefuel * 3;
  const dockDailyCost = daysTaken * 1;
  const totalCost = fuelCost + dockDailyCost;

  const canAfford = company.treasury >= totalCost;

  const [hasRolled, setHasRolled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualD1, setManualD1] = useState(4);
  const [manualD2, setManualD2] = useState(4);
  const [refuelResult, setRefuelResult] = useState<RefuelResult | null>(null);

  const handleRollAndRefuel = (manualDice?: [number, number]) => {
    const rollRes = manualDice 
      ? roll2D6([], 'Control de Combustible', manualDice) 
      : rollDice({ diceCount: 2 });

    const totalWithMods = rollRes.sum + techMods.totalMod;

    try {
      const res = refuelShip({
        company,
        planet,
        unitsToRefuel,
        techRollTotal: totalWithMods,
        techIsDoubleSix: rollRes.isDoubleSix
      });

      setRefuelResult(res);
      setHasRolled(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleConfirmAndClose = () => {
    if (!refuelResult) return;

    const adv = advanceDays(game.date, refuelResult.daysTaken);

    const newLogEntry = {
      id: `log_refuel_${Date.now()}`,
      gameDate: adv.newDate,
      category: 'nave' as const,
      action: 'Repostaje de Combustible',
      details: refuelResult.logNotes.join(' | '),
      timestamp: new Date().toISOString()
    };

    onUpdateGame({
      ...game,
      date: adv.newDate,
      company: refuelResult.nextCompany,
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
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Estación de Repostaje de Combustible
              </h3>
              <p className="text-xs text-slate-400">
                Suministro y control de pureza en {planet.name}
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
          
          {/* Status Combustible */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-slate-400 block uppercase font-bold text-[11px] mb-0.5">Depósito Actual:</span>
              <span className="text-base font-black text-amber-300 font-mono">
                {ship.fuelCurrent} / {ship.fuelMax} U.
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (Faltan {neededFuel} unidades para llenar)
              </span>
            </div>

            <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-slate-400 block uppercase font-bold text-[11px] mb-0.5">Densidad de Combustible:</span>
              <span className="text-base font-black text-slate-100">
                {density} ({unitsPerDay} U/día)
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Velocidad de bombeo local
              </span>
            </div>
          </div>

          {/* Técnico de Repostaje */}
          {fuelTech ? (
            <div className="p-3.5 bg-space-950 border border-space-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Técnico de Repostaje: {fuelTech.name}
                </span>
                <span className="text-space-accent font-mono">
                  Mod: {techMods.totalMod >= 0 ? `+${techMods.totalMod}` : techMods.totalMod}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-space-800/80">
                <div>Experiencia ({fuelTech.experience}): <strong className="text-slate-200">{techMods.expMod >= 0 ? `+${techMods.expMod}` : techMods.expMod}</strong></div>
                <div>Moral ({fuelTech.morale}): <strong className="text-slate-200">{techMods.morMod >= 0 ? `+${techMods.morMod}` : techMods.morMod}</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Sin técnico de repostaje: Si la tirada es menor de 7, la nave sufrirá 1 daño leve por impurezas.</span>
            </div>
          )}

          {/* Selector de Unidades */}
          {!hasRolled ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-bold text-slate-300 uppercase">
                    Unidades de Combustible a Repostar:
                  </label>
                  <span className="font-black text-amber-400 text-sm font-mono">
                    {unitsToRefuel} U.
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, neededFuel)}
                  value={unitsToRefuel}
                  disabled={neededFuel <= 0}
                  onChange={e => setUnitsToRefuel(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Desglose de Coste y Tiempo */}
              <div className="p-4 bg-space-950 border border-space-700 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Combustible ({unitsToRefuel} U x 3 SC):</span>
                  <span className="font-mono font-bold text-slate-100">{fuelCost} SC</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Ocupación de Muelle ({daysTaken} días x 1 SC/d):</span>
                  <span className="font-mono font-bold text-slate-100">{dockDailyCost} SC</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-space-800 font-bold">
                  <span className="text-slate-200 uppercase">Coste Total de la Operación:</span>
                  <span className={`font-mono text-base ${canAfford ? 'text-amber-400' : 'text-rose-400'}`}>
                    {totalCost} SC
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Tiempo requerido en espaciopuerto:</span>
                  <span className="text-sky-400 font-bold">+{daysTaken} {daysTaken === 1 ? 'día' : 'días'}</span>
                </div>
              </div>

              {/* Tirada del Técnico */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase">Tirada Control de Calidad (2D6):</span>
                  <button
                    type="button"
                    onClick={() => setIsManualMode(!isManualMode)}
                    className="text-space-accent hover:text-sky-300 underline font-semibold"
                  >
                    {isManualMode ? 'Modo Automático' : 'Tirada Manual'}
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
                      onClick={() => handleRollAndRefuel([manualD1, manualD2])}
                      disabled={!canAfford || neededFuel <= 0}
                      className="w-full py-2.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 text-xs disabled:opacity-50"
                    >
                      Repostar con Dados [{manualD1}, {manualD2}]
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRollAndRefuel()}
                    disabled={!canAfford || neededFuel <= 0}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Dices className="w-5 h-5" />
                    <span>Confirmar Repostaje ({totalCost} SC, +{daysTaken}d)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Resultado */
            <div className="space-y-4 pt-1">
              <div className={`p-4 rounded-xl border text-center space-y-2 ${
                refuelResult?.damageSuffered === 'ninguno'
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {refuelResult?.damageSuffered === 'ninguno' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  )}
                  <h4 className="text-base font-black uppercase">
                    {refuelResult?.damageSuffered === 'ninguno' ? '¡Repostaje Perfecto sin Daños!' : 'Repostaje con Impurezas (1 Daño Leve)'}
                  </h4>
                </div>

                <div className="text-xs space-y-1">
                  {refuelResult?.logNotes.map((note, idx) => (
                    <p key={idx} className="opacity-90">{note}</p>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
              >
                <span>Finalizar y Aplicar Tiempo (+{refuelResult?.daysTaken}d)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
