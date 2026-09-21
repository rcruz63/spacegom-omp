import { useState, useMemo } from 'react';
import { GameSave } from '../types/game';
import { PlanetData } from '../types/universe';
import { 
  transportPassengers, 
  calculatePassengerFare, 
  TransportPassengersResult 
} from '../engine/trade';
import { rollDice, roll2D6 } from '../engine/dice';
import { 
  Users, 
  Dices, 
  Coins, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface PassengerTransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  planet: PlanetData;
  onUpdateGame: (updated: GameSave) => void;
}

export function PassengerTransportModal({
  isOpen,
  onClose,
  game,
  planet,
  onUpdateGame
}: PassengerTransportModalProps) {
  const company = game.company;
  const ship = company.ship;
  const freeSeats = Math.max(0, ship.passengersMax - ship.passengersCurrent);
  const avgPlanetPassengers = planet.max_passengers || 6;

  // Responsable de soporte a pasajeros
  const passengerManager = useMemo(() => {
    return company.employees.find(
      e => e.isActive && e.position.toLowerCase().includes('soporte a pasajeros')
    );
  }, [company.employees]);

  // Auxiliares de vuelo
  const flightAttendants = useMemo(() => {
    return company.employees.filter(
      e => e.isActive && e.position.toLowerCase().includes('auxiliar de vuelo')
    );
  }, [company.employees]);

  // Modificadores de tirada del Responsable
  const rollMods = useMemo(() => {
    let expMod = 0;
    let morMod = 0;
    if (passengerManager) {
      if (passengerManager.experience === 'veterano') expMod = 1;
      if (passengerManager.experience === 'novato') expMod = -1;
      if (passengerManager.morale === 'alta') morMod = 1;
      if (passengerManager.morale === 'baja') morMod = -1;
    }
    const repMod = Math.floor(company.reputation / 2);
    return {
      expMod,
      morMod,
      repMod,
      totalMod: expMod + morMod + repMod
    };
  }, [passengerManager, company.reputation]);

  // Estado de la tirada
  const [hasRolled, setHasRolled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualD1, setManualD1] = useState(4);
  const [manualD2, setManualD2] = useState(4);

  const [rollData, setRollData] = useState<{
    diceSum: number;
    totalWithMods: number;
    isDoubleSix: boolean;
    passengersOffered: number;
  } | null>(null);

  const [selectedToBoard, setSelectedToBoard] = useState<number>(0);

  // Previsualización de tarifa según pasajeros seleccionados
  const farePreview = useMemo(() => {
    return calculatePassengerFare(company, selectedToBoard);
  }, [company, selectedToBoard]);

  const handleRoll = (manualDice?: [number, number]) => {
    const rollRes = manualDice 
      ? roll2D6([], 'Transporte de Pasajeros', manualDice)
      : rollDice({ diceCount: 2 });

    const diceSum = rollRes.sum;
    const isDoubleSix = rollRes.isDoubleSix;
    const totalWithMods = diceSum + rollMods.totalMod;

    let offered = avgPlanetPassengers;
    if (totalWithMods < 7) {
      offered = Math.floor(avgPlanetPassengers * 0.5);
    } else if (totalWithMods >= 10) {
      offered = avgPlanetPassengers * 2;
    }

    const defaultBoarding = Math.min(freeSeats, offered);

    setRollData({
      diceSum,
      totalWithMods,
      isDoubleSix,
      passengersOffered: offered
    });

    setSelectedToBoard(defaultBoarding);
    setHasRolled(true);
  };

  const handleConfirmBoarding = () => {
    if (!rollData) return;

    const res: TransportPassengersResult = transportPassengers({
      planet,
      company,
      rollTotal: rollData.totalWithMods,
      isDoubleSix: rollData.isDoubleSix,
      selectedCount: selectedToBoard
    });

    const newLogEntry = {
      id: `log_pass_${Date.now()}`,
      gameDate: game.date,
      category: 'comercio' as const,
      action: 'Transporte de Pasajeros',
      details: res.logNotes.join(' | '),
      timestamp: new Date().toISOString()
    };

    onUpdateGame({
      ...game,
      company: res.nextCompany,
      universe: {
        ...game.universe,
        passengersTakenInCurrentVisit: true
      },
      auditLog: [newLogEntry, ...game.auditLog]
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-space-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Transporte de Pasajeros
              </h3>
              <p className="text-xs text-slate-400">
                Captación y alojamiento de viajeros en {planet.name}
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
        <div className="p-6 space-y-5">
          
          {/* Advertencia si no hay plazas o ya se captó */}
          {freeSeats <= 0 && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>El camarote de pasajeros de la nave está lleno ({ship.passengersCurrent}/{ship.passengersMax}).</span>
            </div>
          )}

          {/* Tarjeta de Situación: Planeta y Nave */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Demanda del Planeta
              </span>
              <span className="text-base font-black text-slate-100">
                {avgPlanetPassengers} viajeros promedio
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (Columna *9 del catálogo)
              </span>
            </div>

            <div className="p-3.5 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Aforo en la Nave
              </span>
              <span className="text-base font-black text-space-accent">
                {freeSeats} plazas libres
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                ({ship.passengersCurrent} ocupadas / {ship.passengersMax} máx)
              </span>
            </div>
          </div>

          {/* Responsable de soporte a pasajeros y Modificadores */}
          <div className="p-3.5 bg-space-950 border border-space-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Responsable: {passengerManager ? passengerManager.name : 'Sin asignar (Inexistente)'}
              </span>
              <span className="text-space-accent font-mono">
                Modificador Total: {rollMods.totalMod >= 0 ? `+${rollMods.totalMod}` : rollMods.totalMod}
              </span>
            </div>
            
            {passengerManager ? (
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1 border-t border-space-800/80">
                <div>
                  Experiencia ({passengerManager.experience}): <strong className="text-slate-200">{rollMods.expMod >= 0 ? `+${rollMods.expMod}` : rollMods.expMod}</strong>
                </div>
                <div>
                  Moral ({passengerManager.morale}): <strong className="text-slate-200">{rollMods.morMod >= 0 ? `+${rollMods.morMod}` : rollMods.morMod}</strong>
                </div>
                <div>
                  Reputación/2: <strong className="text-slate-200">{rollMods.repMod >= 0 ? `+${rollMods.repMod}` : rollMods.repMod}</strong>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-amber-300 pt-1">
                Aviso: Sin responsable en plantilla se aplica modificador +0 y no hay bonificaciones de moral.
              </p>
            )}
          </div>

          {/* Tarifa según Auxiliares de Vuelo */}
          <div className="p-3 bg-space-950/60 border border-space-800/80 rounded-xl text-xs space-y-1 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400">Auxiliares de Vuelo en plantilla:</span>
              <strong className="text-slate-100">{flightAttendants.length} auxiliares</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Tarifa por pasaje:</span>
              <span className="text-amber-400 font-bold font-mono">{farePreview.ratePerPassenger} SC / viajero</span>
            </div>
            {(farePreview.noviceCount > 0 || farePreview.veteranCount > 0) && (
              <div className="text-[11px] text-slate-500 pt-1 border-t border-space-800/60">
                Ajuste experiencia auxiliares: 
                {farePreview.noviceCount > 0 && ` -${farePreview.noviceDiscount} SC (${farePreview.noviceCount} novatos)`}
                {farePreview.veteranCount > 0 && ` +${farePreview.veteranBonus} SC (${farePreview.veteranCount} veteranos)`}
              </div>
            )}
          </div>

          {/* Fase 1: Tirada de Dados */}
          {!hasRolled ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase">Tirada de Captación (2D6):</span>
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
                    Resolver Tirada [{manualD1}, {manualD2}]
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRoll()}
                  disabled={freeSeats <= 0}
                  className="w-full py-3 bg-space-accent text-space-950 font-bold rounded-xl hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-space-accent/15 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Dices className="w-5 h-5" />
                  <span>Lanzar 2D6 de Captación</span>
                </button>
              )}
            </div>
          ) : (
            /* Fase 2: Resultado y Selección de Alojamiento */
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-space-950 border border-space-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-space-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">
                      Tirada: {rollData?.diceSum} + Mod: {rollMods.totalMod} = <strong className="text-space-accent text-sm">{rollData?.totalWithMods}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {rollData && rollData.totalWithMods < 7 ? 'Mitad promedio (<7)' :
                     rollData && rollData.totalWithMods <= 9 ? 'Promedio normal (7-9)' :
                     'Doble promedio (≥10)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Viajeros interesados:</span>
                  <span className="text-base font-black text-slate-100">
                    {rollData?.passengersOffered} pasajeros
                  </span>
                </div>

                {/* Selector de cuántos alojar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="text-slate-400 font-semibold uppercase">
                      Pasajeros a alojar en la nave:
                    </label>
                    <span className="font-black text-space-accent text-sm">
                      {selectedToBoard} / {Math.min(freeSeats, rollData?.passengersOffered || 0)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={Math.min(freeSeats, rollData?.passengersOffered || 0)}
                    value={selectedToBoard}
                    onChange={e => setSelectedToBoard(Number(e.target.value))}
                    className="w-full accent-space-accent cursor-pointer"
                  />
                </div>

                {/* Cobro total */}
                <div className="p-3 bg-space-900 border border-space-700/80 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Ingreso a cobrar por adelantado:
                    </span>
                  </div>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    +{farePreview.totalIncome} SC
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmBoarding}
                disabled={selectedToBoard <= 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Confirmar y Cobrar {farePreview.totalIncome} SC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
