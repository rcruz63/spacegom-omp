import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PlanetData } from '../../types/universe';
import { 
  repairShip, 
  getSpaceportRepairCapability, 
  RepairResult 
} from '../../engine/spaceport';
import { advanceDays } from '../../engine/calendar';
import { rollDice, roll2D6 } from '../../engine/dice';
import { 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  ArrowRight,
  Hammer
} from 'lucide-react';

interface SpaceportRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  planet: PlanetData;
  onUpdateGame: (updated: GameSave) => void;
}

export function SpaceportRepairModal({
  isOpen,
  onClose,
  game,
  planet,
  onUpdateGame
}: SpaceportRepairModalProps) {
  const company = game.company;
  const ship = company.ship;

  // Técnico de mantenimiento de astronaves
  const mechanic = useMemo(() => {
    return company.employees.find(
      e => e.isActive && e.position.toLowerCase().includes('mantenimiento')
    );
  }, [company.employees]);

  // Modificadores del técnico
  const techMods = useMemo(() => {
    let expMod = 0;
    let morMod = 0;
    if (mechanic) {
      if (mechanic.experience === 'veterano') expMod = 1;
      if (mechanic.experience === 'novato') expMod = -1;
      if (mechanic.morale === 'alta') morMod = 1;
      if (mechanic.morale === 'baja') morMod = -1;
    }
    return {
      expMod,
      morMod,
      totalMod: expMod + morMod
    };
  }, [mechanic]);

  // Capacidad del astillero local
  const shipyardCap = useMemo(() => {
    return getSpaceportRepairCapability(planet.spaceport_quality);
  }, [planet.spaceport_quality]);

  const [selectedDamage, setSelectedDamage] = useState<'leve' | 'moderado' | 'grave'>(() => {
    if (ship.damageLight > 0) return 'leve';
    if (ship.damageModerate > 0 && shipyardCap.canRepairModerate) return 'moderado';
    if (ship.damageHeavy > 0 && shipyardCap.canRepairHeavy) return 'grave';
    return 'leve';
  });

  const totalDamagesCount = ship.damageLight + ship.damageModerate + ship.damageHeavy;

  const [hasRolled, setHasRolled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualD1, setManualD1] = useState(4);
  const [manualD2, setManualD2] = useState(4);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);

  const handleRollAndRepair = (manualDice?: [number, number]) => {
    const rollRes = manualDice 
      ? roll2D6([], 'Reparación de Casco', manualDice) 
      : rollDice({ diceCount: 2 });

    const totalWithMods = rollRes.sum + techMods.totalMod;

    try {
      const res = repairShip({
        company,
        planet,
        damageType: selectedDamage,
        mechanicRollTotal: totalWithMods,
        mechanicIsDoubleSix: rollRes.isDoubleSix
      });

      setRepairResult(res);
      setHasRolled(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleConfirmAndClose = () => {
    if (!repairResult) return;

    const adv = advanceDays(game.date, repairResult.daysTaken);

    const newLogEntry = {
      id: `log_repair_${Date.now()}`,
      gameDate: adv.newDate,
      category: 'nave' as const,
      action: `Reparación de Daño ${repairResult.damageTypeRepaired.toUpperCase()}`,
      details: repairResult.logNotes.join(' | '),
      timestamp: new Date().toISOString()
    };

    onUpdateGame({
      ...game,
      date: adv.newDate,
      company: repairResult.nextCompany,
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
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Astillero y Reparación de Astronave
              </h3>
              <p className="text-xs text-slate-400">
                Reparaciones estructurales y de casco en {planet.name}
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
          
          {/* Capacidad del Astillero y Estado de Daños */}
          <div className="p-3 bg-space-950 border border-space-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Categoría de Astillero:</span>
            <span className="font-bold text-space-accent">{shipyardCap.tierLabel}</span>
          </div>

          {totalDamagesCount === 0 ? (
            <div className="p-6 bg-space-950 border border-space-800 rounded-xl text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-slate-200 text-sm">El casco de la astronave está impecable.</p>
              <p className="text-slate-500">No hay daños estructurales pendientes de reparar en {ship.name}.</p>
            </div>
          ) : (
            <>
              {/* Tarjetas de Daños */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                {[
                  { 
                    type: 'leve' as const, 
                    label: 'Leves', 
                    count: ship.damageLight, 
                    allowed: shipyardCap.canRepairLight,
                    baseCost: 5, 
                    baseDays: '1d' 
                  },
                  { 
                    type: 'moderado' as const, 
                    label: 'Moderados', 
                    count: ship.damageModerate, 
                    allowed: shipyardCap.canRepairModerate,
                    baseCost: 20, 
                    baseDays: '1D6d' 
                  },
                  { 
                    type: 'grave' as const, 
                    label: 'Graves', 
                    count: ship.damageHeavy, 
                    allowed: shipyardCap.canRepairHeavy,
                    baseCost: 50, 
                    baseDays: '2D6d' 
                  }
                ].map(item => {
                  const isSelected = selectedDamage === item.type;
                  const canSelect = item.count > 0 && item.allowed;

                  return (
                    <button
                      key={item.type}
                      type="button"
                      disabled={!canSelect}
                      onClick={() => setSelectedDamage(item.type)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        !canSelect 
                          ? 'bg-space-950/40 border-space-800/60 opacity-50 cursor-not-allowed text-slate-500'
                          : isSelected
                            ? 'bg-space-800 border-space-accent ring-1 ring-space-accent text-slate-100'
                            : 'bg-space-950 border-space-800 hover:border-space-700 text-slate-300'
                      }`}
                    >
                      <span className="font-bold block text-xs mb-1">{item.label}</span>
                      <span className={`text-xl font-black block font-mono ${
                        item.count > 0 ? 'text-rose-400' : 'text-slate-600'
                      }`}>
                        {item.count}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Base: {item.baseCost} SC ({item.baseDays})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Técnico de Mantenimiento */}
              {mechanic ? (
                <div className="p-3.5 bg-space-950 border border-space-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Técnico de Mantenimiento: {mechanic.name}
                    </span>
                    <span className="text-space-accent font-mono">
                      Mod: {techMods.totalMod >= 0 ? `+${techMods.totalMod}` : techMods.totalMod}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-space-800/80">
                    <div>Experiencia ({mechanic.experience}): <strong className="text-slate-200">{techMods.expMod >= 0 ? `+${techMods.expMod}` : techMods.expMod}</strong></div>
                    <div>Moral ({mechanic.morale}): <strong className="text-slate-200">{techMods.morMod >= 0 ? `+${techMods.morMod}` : techMods.morMod}</strong></div>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Regla: Si la tirada del técnico es de 7 o más, disminuye a la mitad el coste y el tiempo de reparación.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Sin técnico en plantilla: Se abonará la tarifa y tiempo completos de astillero.</span>
                </div>
              )}

              {/* Tirada de Reparación */}
              {!hasRolled ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 uppercase">
                      Tirada del Técnico (2D6):
                    </span>
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
                        onClick={() => handleRollAndRepair([manualD1, manualD2])}
                        className="w-full py-2.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 text-xs"
                      >
                        Reparar con Dados [{manualD1}, {manualD2}]
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRollAndRepair()}
                      className="w-full py-3 bg-space-accent text-space-950 font-bold rounded-xl hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-space-accent/15 text-sm"
                    >
                      <Wrench className="w-5 h-5" />
                      <span>Efectuar Reparación de Daño {selectedDamage.toUpperCase()}</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Resultado de la Reparación */
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-xl border bg-space-950 border-space-700 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-base font-black uppercase text-slate-100">
                      Daño {repairResult?.damageTypeRepaired.toUpperCase()} Reparado con Éxito
                    </h4>
                    
                    <div className="flex items-center justify-center gap-4 text-xs font-bold pt-1">
                      <span className="text-amber-300 font-mono">Coste: {repairResult?.cost} SC</span>
                      <span className="text-sky-400">Tiempo: +{repairResult?.daysTaken}d</span>
                      {repairResult?.technicianOptimized && (
                        <span className="text-emerald-400">(-50% aplicado)</span>
                      )}
                    </div>

                    <div className="text-xs space-y-1 pt-2 border-t border-space-800 text-slate-400">
                      {repairResult?.logNotes.map((note, idx) => (
                        <p key={idx}>{note}</p>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAndClose}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
                  >
                    <span>Finalizar y Aplicar Tiempo (+{repairResult?.daysTaken}d)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
