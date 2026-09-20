import { useState } from 'react';
import { GameSave } from '../../types/game';
import { refuelShip, repairShip } from '../../engine/spaceport';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { advanceDays } from '../../engine/calendar';
import { Wrench, Fuel, Satellite } from 'lucide-react';

interface SpaceportOperationsViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function SpaceportOperationsView({ game, onUpdateGame }: SpaceportOperationsViewProps) {
  const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;

  const [fuelUnits, setFuelUnits] = useState<number>(10);
  const [mechanicRoll, setMechanicRoll] = useState<number>(8);

  const neededFuel = game.company.ship.fuelMax - game.company.ship.fuelCurrent;

  const handleRefuel = () => {
    if (!currentPlanet) {
      alert('Debes estar en un espaciopuerto para repostar.');
      return;
    }

    try {
      const res = refuelShip(game.company, currentPlanet, fuelUnits);
      const adv = advanceDays(game.date, res.daysTaken);

      const updatedLog = [
        {
          id: `log_refuel_${Date.now()}`,
          gameDate: adv.newDate,
          category: 'nave' as const,
          action: 'Repostaje en Espaciopuerto',
          details: res.logNotes.join(' '),
          timestamp: new Date().toISOString()
        },
        ...game.auditLog
      ];

      onUpdateGame({
        ...game,
        date: adv.newDate,
        company: res.nextCompany,
        auditLog: updatedLog
      });

      alert(`¡Repostaje completado! ${res.unitsRefueled} unidades por ${res.totalCost} SC (${res.daysTaken} días).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  const handleRepair = (damageType: 'leve' | 'moderado' | 'grave') => {
    if (!currentPlanet) {
      alert('Debes estar en un espaciopuerto para reparar la nave.');
      return;
    }

    try {
      const res = repairShip(game.company, damageType, mechanicRoll);
      const adv = advanceDays(game.date, res.daysTaken);

      const updatedLog = [
        {
          id: `log_repair_${Date.now()}`,
          gameDate: adv.newDate,
          category: 'nave' as const,
          action: 'Reparación de Daños',
          details: res.logNotes.join(' '),
          timestamp: new Date().toISOString()
        },
        ...game.auditLog
      ];

      onUpdateGame({
        ...game,
        date: adv.newDate,
        company: res.nextCompany,
        auditLog: updatedLog
      });

      alert(`¡Daño ${damageType} reparado! Coste: ${res.cost} SC (${res.daysTaken} días).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ship Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fuel Card */}
        <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-700">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <span>Estación de Repostaje de Combustible</span>
              </h3>
              <span className="text-xs font-mono text-amber-300">
                {game.company.ship.fuelCurrent} / {game.company.ship.fuelMax} Unidades
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Calidad de combustible local: <span className="font-semibold text-slate-200">{currentPlanet?.fuel_density || 'Estándar'}</span>.
              Coste: 3 SC/unidad + 1 SC/día de ocupación del espaciopuerto.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                  Unidades a Repostar (Máx faltante: {neededFuel})
                </label>
                <input
                  type="number"
                  min="1"
                  max={neededFuel || 1}
                  value={fuelUnits}
                  onChange={e => setFuelUnits(Number(e.target.value))}
                  className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
                  disabled={neededFuel <= 0}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRefuel}
            disabled={neededFuel <= 0 || !currentPlanet}
            className="mt-6 w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-space-900 font-bold text-xs rounded-lg transition-colors shadow"
          >
            {neededFuel <= 0 ? 'Depósito Lleno' : 'Repostar Combustible'}
          </button>
        </div>

        {/* Repair Card */}
        <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-700">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-space-accent" />
                <span>Hangar de Reparaciones</span>
              </h3>
              <span className="text-xs font-mono text-rose-400">
                {game.company.ship.damageLight} leves, {game.company.ship.damageModerate} mod, {game.company.ship.damageHeavy} grav
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Calidad del taller: <span className="font-semibold text-slate-200">{currentPlanet?.spaceport_quality || 'Rudimentaria'}</span>.
              Tirada de Técnico de Mantenimiento reduce costes y tiempos al 50%.
            </p>

            <div className="mb-4">
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Tirada Mecánico (2D6 + mods)
              </label>
              <input
                type="number"
                min="2"
                max="15"
                value={mechanicRoll}
                onChange={e => setMechanicRoll(Number(e.target.value))}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRepair('leve')}
                disabled={game.company.ship.damageLight <= 0}
                className="py-2 px-2 bg-space-700 hover:bg-space-600 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg border border-space-600"
              >
                Daño Leve ({game.company.ship.damageLight})
              </button>

              <button
                onClick={() => handleRepair('moderado')}
                disabled={game.company.ship.damageModerate <= 0}
                className="py-2 px-2 bg-space-700 hover:bg-space-600 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg border border-space-600"
              >
                Daño Moderado ({game.company.ship.damageModerate})
              </button>

              <button
                onClick={() => handleRepair('grave')}
                disabled={game.company.ship.damageHeavy <= 0}
                className="py-2 px-2 bg-space-700 hover:bg-space-600 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg border border-space-600"
              >
                Daño Grave ({game.company.ship.damageHeavy})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orbital Facilities Section */}
      <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl">
        <h3 className="text-md font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Satellite className="w-5 h-5 text-indigo-400" />
          <span>Servicios en Instalaciones Orbitales</span>
        </h3>

        {currentPlanet ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-space-900/60 rounded-xl border border-space-700 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-200 mb-1">Centro Cartográfico</h4>
                <p className="text-slate-400">
                  Permite al ingeniero computacional mapear hasta 5 cuadrantes o el área completa.
                </p>
              </div>
              <span className={`mt-3 font-semibold ${currentPlanet.orbital_cartography_center ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentPlanet.orbital_cartography_center ? 'Disponible en órbita' : 'No disponible'}
              </span>
            </div>

            <div className="p-4 bg-space-900/60 rounded-xl border border-space-700 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-200 mb-1">Depósito de Suministros</h4>
                <p className="text-slate-400">
                  Adquisición de armas y equipos de soporte vital avanzados y respiradores.
                </p>
              </div>
              <span className={`mt-3 font-semibold ${currentPlanet.orbital_supply_depot ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentPlanet.orbital_supply_depot ? 'Disponible en órbita' : 'No disponible'}
              </span>
            </div>

            <div className="p-4 bg-space-900/60 rounded-xl border border-space-700 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-200 mb-1">Academia de Astronavegación</h4>
                <p className="text-slate-400">
                  Cursos de perfeccionamiento para pilotos e ingenieros de astronavegación.
                </p>
              </div>
              <span className={`mt-3 font-semibold ${currentPlanet.orbital_astro_academy ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentPlanet.orbital_astro_academy ? 'Disponible en órbita' : 'No disponible'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-center py-6 text-xs text-slate-500">
            Navega a un planeta para acceder a sus instalaciones orbitales.
          </p>
        )}
      </div>
    </div>
  );
}
