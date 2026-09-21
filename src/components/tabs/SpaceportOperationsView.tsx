import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { getSpaceportRepairCapability } from '../../engine/spaceport';
import { SpaceportDockingModal } from '../spaceport/SpaceportDockingModal';
import { SpaceportRefuelModal } from '../spaceport/SpaceportRefuelModal';
import { SpaceportRepairModal } from '../spaceport/SpaceportRepairModal';
import { 
  Wrench, 
  Fuel, 
  Satellite, 
  Anchor, 
  CheckCircle2 
} from 'lucide-react';

interface SpaceportOperationsViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function SpaceportOperationsView({ game, onUpdateGame }: SpaceportOperationsViewProps) {
  const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;

  const [isDockingModalOpen, setIsDockingModalOpen] = useState(false);
  const [isRefuelModalOpen, setIsRefuelModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);

  const isDockedAtSpaceport = game.universe.currentLocation === 'espaciopuerto';
  const neededFuel = Math.max(0, game.company.ship.fuelMax - game.company.ship.fuelCurrent);
  const totalDamages = game.company.ship.damageLight + game.company.ship.damageModerate + game.company.ship.damageHeavy;

  const repairCap = useMemo(() => {
    return getSpaceportRepairCapability(currentPlanet?.spaceport_quality || 'MED');
  }, [currentPlanet?.spaceport_quality]);

  return (
    <div className="space-y-6">
      
      {/* Banner de Estado de Amarre */}
      {currentPlanet ? (
        <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
          isDockedAtSpaceport 
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
            : 'bg-space-800 border-space-700 text-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${
              isDockedAtSpaceport ? 'bg-emerald-900/60 border-emerald-700 text-emerald-300' : 'bg-space-900 border-space-700 text-space-accent'
            }`}>
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">
                {isDockedAtSpaceport 
                  ? `Nave Amarrada en el Espaciopuerto de ${currentPlanet.name}` 
                  : `Nave en aproximación a ${currentPlanet.name}`}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Calidad: <strong className="text-slate-200">{currentPlanet.spaceport_quality}</strong> · 
                Combustible: <strong className="text-slate-200">{currentPlanet.fuel_density}</strong> · 
                Tasa de Amarre: <strong className="text-amber-300 font-mono">{currentPlanet.docking_price} SC</strong>
              </p>
            </div>
          </div>

          {!isDockedAtSpaceport ? (
            <button
              type="button"
              onClick={() => setIsDockingModalOpen(true)}
              className="px-4 py-2 bg-space-accent hover:bg-sky-400 text-space-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-colors"
            >
              <Anchor className="w-4 h-4" />
              <span>Efectuar Maniobra de Amarre (Tirada Piloto)</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Muelle de Amarre Ocupado</span>
            </span>
          )}
        </div>
      ) : (
        <div className="p-4 bg-space-800/60 border border-space-700 rounded-xl text-center text-xs text-slate-400">
          Navega a un planeta con espaciopuerto para repostar o reparar tu astronave.
        </div>
      )}

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
              <span className="text-xs font-mono text-amber-300 font-bold">
                {game.company.ship.fuelCurrent} / {game.company.ship.fuelMax} U.
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Calidad local: <strong className="text-slate-200">{currentPlanet?.fuel_density || 'Estándar'}</strong>.
              Coste: 3 SC/unidad + 1 SC/día de ocupación del muelle.
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Espacio disponible en depósito:</span>
                <span className="font-mono font-bold text-slate-100">{neededFuel} unidades</span>
              </div>
              <div className="flex justify-between">
                <span>Coste unitario:</span>
                <span className="font-mono text-amber-300">3 SC / unidad</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsRefuelModalOpen(true)}
              disabled={neededFuel <= 0 || !currentPlanet || !isDockedAtSpaceport}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-space-950 font-bold text-xs rounded-lg transition-colors shadow flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              <Fuel className="w-4 h-4" />
              <span>
                {neededFuel <= 0 
                  ? 'Depósito al Máximo' 
                  : !isDockedAtSpaceport 
                    ? 'Requiere Amarre en Espaciopuerto' 
                    : 'Repostar Combustible'}
              </span>
            </button>
          </div>
        </div>

        {/* Repair Card */}
        <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-700">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-space-accent" />
                <span>Astillero y Reparación de Astronave</span>
              </h3>
              <span className={`text-xs font-mono font-bold ${
                totalDamages > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {game.company.ship.damageLight}L · {game.company.ship.damageModerate}M · {game.company.ship.damageHeavy}G
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Astillero: <strong className="text-slate-200">{repairCap.tierLabel}</strong>.
              Tirada del Técnico de Mantenimiento reduce costes y tiempos al 50%.
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Daños actuales en casco:</span>
                <span className={totalDamages > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {totalDamages === 0 ? 'Sin daños estructurales' : `${totalDamages} daños pendientes`}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Capacidad taller:</span>
                <span>{repairCap.canRepairHeavy ? 'Avanzado' : repairCap.canRepairModerate ? 'Normal' : 'Limitado'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsRepairModalOpen(true)}
              disabled={totalDamages <= 0 || !currentPlanet || !isDockedAtSpaceport || !repairCap.isAvailable}
              className="w-full py-2.5 bg-space-accent hover:bg-sky-400 disabled:opacity-50 text-space-950 font-bold text-xs rounded-lg transition-colors shadow flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              <Wrench className="w-4 h-4" />
              <span>
                {totalDamages <= 0
                  ? 'Casco sin Daños'
                  : !isDockedAtSpaceport
                    ? 'Requiere Amarre en Espaciopuerto'
                    : 'Reparar Astronave en Astillero'}
              </span>
            </button>
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
                {currentPlanet.orbital_cartography_center ? '✓ Disponible en órbita' : '✗ No disponible'}
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
                {currentPlanet.orbital_supply_depot ? '✓ Disponible en órbita' : '✗ No disponible'}
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
                {currentPlanet.orbital_astro_academy ? '✓ Disponible en órbita' : '✗ No disponible'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-center py-6 text-xs text-slate-500">
            Navega a un planeta para acceder a sus instalaciones orbitales.
          </p>
        )}
      </div>

      {/* Modales de Espaciopuerto */}
      {currentPlanet && (
        <>
          <SpaceportDockingModal
            isOpen={isDockingModalOpen}
            onClose={() => setIsDockingModalOpen(false)}
            game={game}
            planet={currentPlanet}
            onUpdateGame={onUpdateGame}
          />

          <SpaceportRefuelModal
            isOpen={isRefuelModalOpen}
            onClose={() => setIsRefuelModalOpen(false)}
            game={game}
            planet={currentPlanet}
            onUpdateGame={onUpdateGame}
          />

          <SpaceportRepairModal
            isOpen={isRepairModalOpen}
            onClose={() => setIsRepairModalOpen(false)}
            game={game}
            planet={currentPlanet}
            onUpdateGame={onUpdateGame}
          />
        </>
      )}

    </div>
  );
}
