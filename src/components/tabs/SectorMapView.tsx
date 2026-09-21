import { useState } from 'react';
import { GameSave } from '../../types/game';
import { configureQuadrant } from '../../engine/universe';
import { travelToQuadrant, moveShipLocation, disembarkPassengers } from '../../engine/navigation';
import { advanceDays } from '../../engine/calendar';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { Compass, Globe, Navigation, Fuel, Radio } from 'lucide-react';

interface SectorMapViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4, 5, 6];

export function SectorMapView({ game, onUpdateGame }: SectorMapViewProps) {
  const currentArea = game.universe.areas[game.universe.currentAreaId];
  const [selectedQuadKey, setSelectedQuadKey] = useState<string>(
    `${game.universe.currentCol}${game.universe.currentRow}`
  );

  const selectedQuad = currentArea?.quadrants[selectedQuadKey];
  const selectedPlanet = selectedQuad?.planetCode ? PLANETS_BY_CODE[selectedQuad.planetCode] : null;

  const handleConfigureQuadrant = (col: string, row: number) => {
    const key = `${col}${row}`;
    const result = configureQuadrant(game.universe, game.universe.currentAreaId, col, row);

    // Configurar consume 1 día y 5 SC
    const adv = advanceDays(game.date, 1);
    const logDetails = result.hadPlanet
      ? `Configurado cuadrante ${key}: ¡Descubierto mundo ${result.planetDiscovered?.name} (código ${result.planetDiscovered?.code})!`
      : `Configurado cuadrante ${key}: Espacio vacío sin mundos de interés.`;

    const updatedLog = [
      {
        id: `log_conf_${Date.now()}`,
        gameDate: adv.newDate,
        category: 'sistema' as const,
        action: 'Configurar Cuadrante',
        details: logDetails,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      date: adv.newDate,
      universe: result.nextUniverse,
      auditLog: updatedLog
    });
  };

  const handleTravelToSelected = () => {
    if (!selectedQuad) return;
    if (game.company.ship.fuelCurrent < 1) {
      alert('¡Sin combustible suficiente para efectuar el hipersalto!');
      return;
    }

    // Hipersalto consume 1 combustible y 1 día
    const adv = advanceDays(game.date, 1);
    const nextUniv = travelToQuadrant(game.universe, selectedQuad.col, selectedQuad.row);

    const updatedLog = [
      {
        id: `log_jump_${Date.now()}`,
        gameDate: adv.newDate,
        category: 'nave' as const,
        action: 'Hipersalto Interestelar',
        details: `Viaje a cuadrante ${selectedQuad.col}${selectedQuad.row} (Estación de Hiperdisparo). Combustible -1.`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      date: adv.newDate,
      universe: nextUniv,
      company: {
        ...game.company,
        ship: {
          ...game.company.ship,
          fuelCurrent: game.company.ship.fuelCurrent - 1
        }
      },
      auditLog: updatedLog
    });
  };

  const handleChangeShipLocation = (loc: GameSave['universe']['currentLocation']) => {
    const nextUniv = moveShipLocation(game.universe, loc);
    let nextComp = game.company;
    let updatedLog = game.auditLog;

    // Al llegar a la superficie de un MUNDO, los pasajeros desembarcan
    if (loc === 'mundo' && game.company.ship.passengersCurrent > 0) {
      const dis = disembarkPassengers(game.company);
      nextComp = dis.nextCompany;
      const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;
      const newLog = {
        id: `log_disembark_${Date.now()}`,
        gameDate: game.date,
        category: 'nave' as const,
        action: 'Desembarco de Pasajeros',
        details: `Llegada a la superficie de ${currentPlanet?.name || 'mundo'}: Desembarcan ${dis.disembarkedCount} pasajeros.`,
        timestamp: new Date().toISOString()
      };
      updatedLog = [newLog, ...game.auditLog];
    }

    onUpdateGame({
      ...game,
      universe: nextUniv,
      company: nextComp,
      auditLog: updatedLog
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Column */}
      <div className="lg:col-span-2 bg-space-800 border border-space-700 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-space-700">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-space-accent" />
              <span>Mapa del Área {game.universe.currentAreaId}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Densidad de mundos: <span className="text-space-accent font-semibold">{currentArea?.density}</span> (
              {currentArea?.discoveredPlanets.length} mundos descubiertos)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-space-900 px-3 py-1.5 rounded-lg border border-space-700">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>Combustible: {game.company.ship.fuelCurrent} / {game.company.ship.fuelMax}</span>
          </div>
        </div>

        {/* 6x6 Sector Grid */}
        <div className="grid grid-cols-6 gap-2 max-w-lg mx-auto">
          {ROWS.map(row => (
            COLS.map(col => {
              const key = `${col}${row}`;
              const quad = currentArea?.quadrants[key];
              const isCurrent = game.universe.currentCol === col && game.universe.currentRow === row;
              const isSelected = selectedQuadKey === key;
              const hasPlanet = quad?.planetCode !== null && quad?.planetCode !== undefined;
              const isConfigured = quad?.isConfigured;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedQuadKey(key)}
                  className={`aspect-square rounded-xl p-2 flex flex-col justify-between items-center transition-all border ${
                    isSelected
                      ? 'ring-2 ring-space-accent border-space-accent bg-space-700/80 shadow-lg shadow-space-accent/20'
                      : isCurrent
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : isConfigured
                      ? 'border-space-600 bg-space-900/60 hover:bg-space-700/40'
                      : 'border-space-700/40 bg-space-900/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>{key}</span>
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Posición actual" />
                    )}
                  </div>

                  <div className="my-auto">
                    {hasPlanet ? (
                      <Globe className="w-5 h-5 text-sky-400" />
                    ) : isConfigured ? (
                      <span className="text-[10px] text-slate-500">Vacío</span>
                    ) : (
                      <span className="text-[11px] text-slate-600 font-mono">?</span>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-400 truncate max-w-full font-mono">
                    {hasPlanet ? quad?.planetCode : isConfigured ? '-' : 'Incógnito'}
                  </div>
                </button>
              );
            })
          ))}
        </div>

        {/* Ship Location in Planet Context */}
        <div className="mt-6 pt-4 border-t border-space-700">
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            Posición de la Astronave en el Cuadrante Actual:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'mundo', label: 'Superficie (Mundo)' },
              { id: 'espaciopuerto', label: 'Espaciopuerto' },
              { id: 'instalacion_orbital', label: 'Instalación Orbital' },
              { id: 'estacion_hiperdisparo', label: 'Estación de Hiperdisparo' }
            ].map(loc => (
              <button
                key={loc.id}
                onClick={() => handleChangeShipLocation(loc.id as GameSave['universe']['currentLocation'])}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  game.universe.currentLocation === loc.id
                    ? 'bg-space-accent text-space-900 border-space-accent'
                    : 'bg-space-900 text-slate-300 border-space-700 hover:bg-space-700'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quadrant Detail Column */}
      <div className="bg-space-800 border border-space-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-700">
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-space-accent" />
              <span>Cuadrante {selectedQuadKey}</span>
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 bg-space-900 text-slate-300 rounded border border-space-700">
              {selectedQuad?.isConfigured ? 'Configurado' : 'Sin Explorar'}
            </span>
          </div>

          {selectedQuad?.isConfigured ? (
            selectedPlanet ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Planeta:</span>
                  <p className="text-base font-bold text-space-accent">{selectedPlanet.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Código #{selectedPlanet.code}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-space-900/60 p-3 rounded-lg border border-space-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Soporte Vital:</span>
                    <span className="font-semibold text-slate-200">{selectedPlanet.life_support}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Espaciopuerto:</span>
                    <span className="font-semibold text-slate-200">{selectedPlanet.spaceport_quality}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Combustible:</span>
                    <span className="font-semibold text-slate-200">{selectedPlanet.fuel_density}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Distancia Hiper:</span>
                    <span className="font-semibold text-slate-200">{selectedPlanet.days_to_hyperspace} días</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Pasajeros Máx:</span>
                    <span className="font-semibold text-slate-200">{selectedPlanet.max_passengers}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Convenio Spacegom:</span>
                    <span className="font-semibold text-emerald-400">{selectedPlanet.convenio_spacegom ? 'Sí' : 'No'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase mb-1">Instalaciones Orbitales:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedPlanet.orbital_cartography_center === 1 && (
                      <span className="px-2 py-0.5 bg-space-700 text-sky-300 rounded text-[10px]">Cartografía</span>
                    )}
                    {selectedPlanet.orbital_supply_depot === 1 && (
                      <span className="px-2 py-0.5 bg-space-700 text-amber-300 rounded text-[10px]">Suministros</span>
                    )}
                    {selectedPlanet.orbital_astro_academy === 1 && (
                      <span className="px-2 py-0.5 bg-space-700 text-indigo-300 rounded text-[10px]">Academia</span>
                    )}
                    {selectedPlanet.orbital_hackers === 1 && (
                      <span className="px-2 py-0.5 bg-space-700 text-rose-300 rounded text-[10px]">Piratas Inf.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>Este cuadrante está configurado pero no contiene ningún planeta habitable ni estación orbital.</p>
              </div>
            )
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="mb-4">
                El cuadrante está sin explorar. Tu ingeniero computacional puede configurarlo desde una Estación de Hiperdisparo o Centro Cartográfico.
              </p>
              <button
                onClick={() => selectedQuad && handleConfigureQuadrant(selectedQuad.col, selectedQuad.row)}
                className="w-full py-2 bg-space-accent text-space-900 font-bold rounded-lg hover:bg-sky-400 transition-colors shadow"
              >
                Configurar Cuadrante (1 día)
              </button>
            </div>
          )}
        </div>

        {/* Action Button: Jump to Selected Quadrant */}
        {selectedQuadKey !== `${game.universe.currentCol}${game.universe.currentRow}` && (
          <div className="pt-4 border-t border-space-700 mt-4">
            <button
              onClick={handleTravelToSelected}
              disabled={game.company.ship.fuelCurrent < 1}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow"
            >
              <Navigation className="w-4 h-4" />
              <span>Efectuar Hipersalto a {selectedQuadKey}</span>
            </button>
            <span className="text-[10px] text-slate-500 text-center block mt-1">
              Consume 1 combustible y 1 día de viaje
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
