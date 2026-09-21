import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PlanetData } from '../../types/universe';
import { 
  executeLandingManeuver, 
  executeOrbitalDockingManeuver, 
  executeTransitToHyperspace,
  ManeuverType 
} from '../../engine/flightManeuvers';
import { advanceDays } from '../../engine/calendar';
import { rollDice, roll2D6 } from '../../engine/dice';
import { 
  Dices, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  ArrowRight,
  Globe,
  Satellite,
  Radio
} from 'lucide-react';

interface FlightManeuverModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  planet: PlanetData;
  targetManeuver: ManeuverType;
  onUpdateGame: (updated: GameSave) => void;
}

export function FlightManeuverModal({
  isOpen,
  onClose,
  game,
  planet,
  targetManeuver,
  onUpdateGame
}: FlightManeuverModalProps) {
  const company = game.company;
  const ship = company.ship;

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
    const shipMod = ship.diceModifier || 0;
    return {
      expMod,
      morMod,
      shipMod,
      totalMod: expMod + morMod + shipMod
    };
  }, [pilot, ship.diceModifier]);

  const [hasRolled, setHasRolled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualD1, setManualD1] = useState(4);
  const [manualD2, setManualD2] = useState(4);

  const [resultLog, setResultLog] = useState<{
    success: boolean;
    damageSuffered: string;
    logNotes: string[];
    nextGame: GameSave;
  } | null>(null);

  // Parámetros de tránsito sublumínico a hiperdisparo
  const transitDays = planet.days_to_hyperspace || 5;
  const transitFuel = Math.max(1, Math.ceil(transitDays / 5));
  const canAffordTransitFuel = ship.fuelCurrent >= transitFuel;

  const handleRollPilotManeuver = (manualDice?: [number, number]) => {
    const rollRes = manualDice 
      ? roll2D6([], 'Maniobra de Vuelo', manualDice) 
      : rollDice({ diceCount: 2 });

    const totalWithMods = rollRes.sum + pilotMods.totalMod;

    if (targetManeuver === 'aterrizaje') {
      const res = executeLandingManeuver(
        company,
        game.universe,
        planet,
        totalWithMods,
        rollRes.isDoubleSix
      );

      const newLogEntry = {
        id: `log_land_${Date.now()}`,
        gameDate: game.date,
        category: 'nave' as const,
        action: 'Aterrizaje en Superficie',
        details: res.logNotes.join(' | '),
        timestamp: new Date().toISOString()
      };

      setResultLog({
        success: res.success,
        damageSuffered: res.damageSuffered,
        logNotes: res.logNotes,
        nextGame: {
          ...game,
          company: res.nextCompany,
          universe: res.nextUniverse,
          auditLog: [newLogEntry, ...game.auditLog]
        }
      });
      setHasRolled(true);
    } else if (targetManeuver === 'amarre_orbital') {
      const res = executeOrbitalDockingManeuver(
        company,
        game.universe,
        planet,
        totalWithMods,
        rollRes.isDoubleSix
      );

      const newLogEntry = {
        id: `log_orbital_${Date.now()}`,
        gameDate: game.date,
        category: 'nave' as const,
        action: 'Amarre en Instalaciones Orbitales',
        details: res.logNotes.join(' | '),
        timestamp: new Date().toISOString()
      };

      setResultLog({
        success: res.success,
        damageSuffered: res.damageSuffered,
        logNotes: res.logNotes,
        nextGame: {
          ...game,
          company: res.nextCompany,
          universe: res.nextUniverse,
          auditLog: [newLogEntry, ...game.auditLog]
        }
      });
      setHasRolled(true);
    }
  };

  const handleConfirmTransit = () => {
    try {
      const res = executeTransitToHyperspace(company, game.universe, planet);
      const adv = advanceDays(game.date, res.daysTaken);

      const newLogEntry = {
        id: `log_transit_${Date.now()}`,
        gameDate: adv.newDate,
        category: 'nave' as const,
        action: 'Tránsito a Estación de Hiperdisparo',
        details: res.logNotes.join(' | '),
        timestamp: new Date().toISOString()
      };

      onUpdateGame({
        ...game,
        date: adv.newDate,
        company: res.nextCompany,
        universe: res.nextUniverse,
        auditLog: [newLogEntry, ...game.auditLog]
      });

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  const handleFinishAndApply = () => {
    if (resultLog) {
      onUpdateGame(resultLog.nextGame);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-space-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
              {targetManeuver === 'aterrizaje' && <Globe className="w-5 h-5 text-emerald-400" />}
              {targetManeuver === 'amarre_orbital' && <Satellite className="w-5 h-5 text-indigo-400" />}
              {targetManeuver === 'transito_hiperdisparo' && <Radio className="w-5 h-5 text-sky-400" />}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                {targetManeuver === 'aterrizaje' && `Aterrizaje en ${planet.name}`}
                {targetManeuver === 'amarre_orbital' && `Amarre Orbital en ${planet.name}`}
                {targetManeuver === 'transito_hiperdisparo' && 'Tránsito a Hiperdisparo'}
              </h3>
              <p className="text-xs text-slate-400">
                Maniobra de aproximación y navegación sublumínica
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
          
          {targetManeuver === 'transito_hiperdisparo' ? (
            /* Tránsito a Estación de Hiperdisparo */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-space-950 border border-space-800 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase font-semibold">Distancia sublumínica:</span>
                  <span className="text-slate-100 font-bold">{transitDays} días de viaje</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase font-semibold">Consumo de Combustible:</span>
                  <span className="text-amber-400 font-mono font-bold">-{transitFuel} U (1 U cada 5 días)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-space-800">
                  <span className="text-slate-400 uppercase font-semibold">Combustible disponible:</span>
                  <span className={`font-mono font-bold ${canAffordTransitFuel ? 'text-slate-100' : 'text-rose-400'}`}>
                    {ship.fuelCurrent} / {ship.fuelMax} U
                  </span>
                </div>
              </div>

              {!canAffordTransitFuel ? (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Sin combustible suficiente para alcanzar la Estación de Hiperdisparo. Reposta antes en el espaciopuerto.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmTransit}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-sky-500/15"
                >
                  <Radio className="w-4 h-4" />
                  <span>Iniciar Tránsito Sublumínico (+{transitDays}d, -{transitFuel} U)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            /* Aterrizaje o Amarre Orbital (con tirada de Piloto) */
            <>
              {/* Piloto */}
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
                    <div>Exp ({pilot.experience}): <strong className="text-slate-200">{pilotMods.expMod >= 0 ? `+${pilotMods.expMod}` : pilotMods.expMod}</strong></div>
                    <div>Moral ({pilot.morale}): <strong className="text-slate-200">{pilotMods.morMod >= 0 ? `+${pilotMods.morMod}` : pilotMods.morMod}</strong></div>
                    <div>Modif. Nave: <strong className="text-slate-200">{pilotMods.shipMod}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Sin piloto asignado: Se aplicará modificador +0 a la maniobra.</span>
                </div>
              )}

              {targetManeuver === 'aterrizaje' && ship.passengersCurrent > 0 && (
                <div className="p-3 bg-space-950/60 border border-space-800/80 rounded-xl text-[11px] text-slate-400">
                  Aviso: Al tocar superficie desembarcarán automáticamente los <strong className="text-space-accent">{ship.passengersCurrent} pasajeros</strong> a bordo.
                </div>
              )}

              {!hasRolled ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 uppercase">Tirada de Maniobra (2D6):</span>
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
                        onClick={() => handleRollPilotManeuver([manualD1, manualD2])}
                        className="w-full py-2.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 text-xs"
                      >
                        Maniobrar con Dados [{manualD1}, {manualD2}]
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRollPilotManeuver()}
                      className="w-full py-3 bg-space-accent text-space-950 font-bold rounded-xl hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-space-accent/15 text-sm"
                    >
                      <Dices className="w-5 h-5" />
                      <span>Ejecutar {targetManeuver === 'aterrizaje' ? 'Aterrizaje' : 'Amarre Orbital'} (2D6)</span>
                    </button>
                  )}

                  <p className="text-[11px] text-slate-500 text-center">
                    Regla: 7 o más: sin daños. 6 o menos: la nave sufre 1 daño leve (1-5 en 1D6) o 1 moderado (6 en 1D6).
                  </p>
                </div>
              ) : (
                /* Resultado */
                <div className="space-y-4 pt-1">
                  <div className={`p-4 rounded-xl border text-center space-y-2 ${
                    resultLog?.success 
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
                      : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                  }`}>
                    <div className="flex items-center justify-center gap-2">
                      {resultLog?.success ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                      )}
                      <h4 className="text-base font-black uppercase">
                        {resultLog?.success ? '¡Maniobra Perfecta sin Daños!' : `Impacto: Daño ${resultLog?.damageSuffered?.toUpperCase()}`}
                      </h4>
                    </div>

                    <div className="text-xs space-y-1">
                      {resultLog?.logNotes.map((note, idx) => (
                        <p key={idx} className="opacity-90">{note}</p>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishAndApply}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
                  >
                    <span>Confirmar Maniobra y Continuar</span>
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
