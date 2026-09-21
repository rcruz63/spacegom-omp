import { useState } from 'react';
import { GameSave } from '../../types/game';
import { configureQuadrant } from '../../engine/universe';
import { travelToQuadrant } from '../../engine/navigation';
import { FlightManeuverModal } from '../navigation/FlightManeuverModal';
import { SpaceportDockingModal } from '../spaceport/SpaceportDockingModal';
import { ManeuverType } from '../../engine/flightManeuvers';
import { advanceDays } from '../../engine/calendar';
import { PLANETS_BY_CODE } from '../../engine/universe';

import { SectorNavigationHeader } from '../sector/SectorNavigationHeader';
import { SectorGridMap } from '../sector/SectorGridMap';
import { PlanetFullCard } from '../sector/PlanetFullCard';
import { DiscoveredPlanetsPanel } from '../sector/DiscoveredPlanetsPanel';

import { 
  Navigation, 
  Radio, 
  Globe, 
  MapPin 
} from 'lucide-react';

interface SectorMapViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function SectorMapView({ game, onUpdateGame }: SectorMapViewProps) {
  // Sector que se está visualizando (por defecto el sector actual de la nave)
  const [viewedAreaId, setViewedAreaId] = useState<number>(game.universe.currentAreaId);

  // Cuadrante seleccionado para inspeccionar en el mapa
  const [selectedQuadKey, setSelectedQuadKey] = useState<string>(
    `${game.universe.currentCol}${game.universe.currentRow}`
  );

  const effectiveOriginCode = game.universe.originPlanetCode || (game.universe.usedPlanetCodes && game.universe.usedPlanetCodes[0]) || null;

  const viewedArea = game.universe.areas[viewedAreaId];
  const selectedQuad = viewedArea?.quadrants[selectedQuadKey];
  const selectedPlanet = selectedQuad?.planetCode ? PLANETS_BY_CODE[selectedQuad.planetCode] : null;

  // Planeta actual donde se encuentra físicamente la nave
  const currentQuad = game.universe.areas[game.universe.currentAreaId]?.quadrants[
    `${game.universe.currentCol}${game.universe.currentRow}`
  ];
  const currentPlanet = currentQuad?.planetCode ? PLANETS_BY_CODE[currentQuad.planetCode] : null;

  // Modales de maniobras
  const [isManeuverModalOpen, setIsManeuverModalOpen] = useState(false);
  const [targetManeuver, setTargetManeuver] = useState<ManeuverType>('aterrizaje');
  const [isDockingModalOpen, setIsDockingModalOpen] = useState(false);

  // Configurar cuadrante inexplorado
  const handleConfigureQuadrant = (col: string, row: number) => {
    const key = `${col}${row}`;
    const result = configureQuadrant(game.universe, viewedAreaId, col, row);

    const adv = advanceDays(game.date, 1);
    const logDetails = result.hadPlanet
      ? `Configurado cuadrante ${key}: ¡Descubierto mundo ${result.planetDiscovered?.name} (código #${result.planetDiscovered?.code})!`
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

  // Hipersalto a cuadrante seleccionado (dentro del mismo sector)
  const handleTravelToSelectedQuad = () => {
    if (!selectedQuad) return;
    if (game.company.ship.fuelCurrent < 1) {
      alert('¡Sin combustible suficiente para efectuar el hipersalto!');
      return;
    }

    const adv = advanceDays(game.date, 1);
    const nextUniv = travelToQuadrant(game.universe, selectedQuad.col, selectedQuad.row, viewedAreaId);

    const updatedLog = [
      {
        id: `log_jump_${Date.now()}`,
        gameDate: adv.newDate,
        category: 'nave' as const,
        action: 'Hipersalto Interestelar',
        details: `Viaje a cuadrante ${selectedQuad.col}${selectedQuad.row}, Área ${viewedAreaId} (Estación de Hiperdisparo). Combustible -1.`,
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

  // Hipersalto a sector adyacente (+1 o -1)
  const handleJumpToAdjacentSector = (targetAreaId: number) => {
    if (game.company.ship.fuelCurrent < 1) {
      alert('¡Sin combustible suficiente para efectuar el hipersalto intersectorial!');
      return;
    }

    const adv = advanceDays(game.date, 1);
    // Salto al primer cuadrante por defecto del nuevo sector (ej. A1)
    const nextUniv = travelToQuadrant(game.universe, 'A', 1, targetAreaId);

    const updatedLog = [
      {
        id: `log_sector_jump_${Date.now()}`,
        gameDate: adv.newDate,
        category: 'nave' as const,
        action: 'Hipersalto Intersectorial',
        details: `Hipersalto de Área ${game.universe.currentAreaId} a Área ${targetAreaId}. Combustible -1.`,
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

    setViewedAreaId(targetAreaId);
    setSelectedQuadKey('A1');
  };

  // Solicitar cambio de sub-localización de la nave (con maniobra reglamentaria)
  const handleRequestLocationChange = (loc: GameSave['universe']['currentLocation']) => {
    if (game.universe.currentLocation === loc) return;

    if (!currentPlanet) {
      alert('No hay un planeta en este cuadrante para realizar maniobras orbitales o de superficie.');
      return;
    }

    if (loc === 'espaciopuerto') {
      setIsDockingModalOpen(true);
      return;
    }

    if (loc === 'mundo') {
      setTargetManeuver('aterrizaje');
      setIsManeuverModalOpen(true);
      return;
    }

    if (loc === 'instalacion_orbital') {
      setTargetManeuver('amarre_orbital');
      setIsManeuverModalOpen(true);
      return;
    }

    if (loc === 'estacion_hiperdisparo') {
      setTargetManeuver('transito_hiperdisparo');
      setIsManeuverModalOpen(true);
      return;
    }
  };

  // Seleccionar un planeta descubierto de la lista para inspeccionarlo
  const handleSelectDiscoveredPlanet = (planetCode: number) => {
    if (!viewedArea) return;
    for (const [key, q] of Object.entries(viewedArea.quadrants)) {
      if (q.planetCode === planetCode) {
        setSelectedQuadKey(key);
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header con Navegación entre Sectores 2-12 y Planeta de Origen */}
      <SectorNavigationHeader
        currentAreaId={game.universe.currentAreaId}
        viewedAreaId={viewedAreaId}
        universe={game.universe}
        fuelCurrent={game.company.ship.fuelCurrent}
        onViewAreaChange={setViewedAreaId}
        onJumpToSector={handleJumpToAdjacentSector}
      />

      {/* 2. Barra de Posición y Maniobras de la Nave */}
      {currentPlanet && (
        <div className="p-4 bg-space-800 border border-space-700 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              Posición actual de la nave en <strong>{currentPlanet.name}</strong> (#{currentPlanet.code}):
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'mundo', label: 'Superficie (Mundo)' },
              { id: 'espaciopuerto', label: 'Espaciopuerto' },
              { id: 'instalacion_orbital', label: 'Instalación Orbital' },
              { id: 'estacion_hiperdisparo', label: 'Estación de Hiperdisparo' }
            ].map(loc => {
              const isCurrent = game.universe.currentLocation === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleRequestLocationChange(loc.id as GameSave['universe']['currentLocation'])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    isCurrent
                      ? 'bg-space-accent text-space-950 border-space-accent shadow-sm'
                      : 'bg-space-900 text-slate-300 border-space-700 hover:bg-space-700 hover:text-white'
                  }`}
                >
                  {loc.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Contenedor Principal: Mapa a la Izquierda y Fichas Detalladas a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Mapa 6x6 con Fondo Estrellado */}
        <div className="lg:col-span-7 space-y-4">
          <SectorGridMap
            viewedArea={viewedArea}
            viewedAreaId={viewedAreaId}
            universe={game.universe}
            selectedQuadKey={selectedQuadKey}
            onSelectQuadrantKey={setSelectedQuadKey}
          />

          {/* Botón de Hipersalto al Cuadrante Seleccionado */}
          {selectedQuad && selectedQuadKey !== `${game.universe.currentCol}${game.universe.currentRow}` && (
            <div className="p-4 bg-space-800 border border-space-700 rounded-2xl flex items-center justify-between gap-4 shadow-lg">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Cuadrante Objetivo: {selectedQuadKey}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedQuad.isConfigured 
                    ? (selectedPlanet ? `Mundo ${selectedPlanet.name} (#${selectedPlanet.code})` : 'Espacio vacío')
                    : 'Sin explorar (requiere configurar al llegar)'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleTravelToSelectedQuad}
                disabled={game.company.ship.fuelCurrent < 1}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-xs transition-colors"
              >
                <Navigation className="w-4 h-4" />
                <span>Hipersalto a {selectedQuadKey} (-1 comb, +1d)</span>
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Ficha Exhaustiva del Planeta y Lista de Descubiertos */}
        <div className="lg:col-span-5 space-y-4">
          {/* Ficha Completa del Planeta Seleccionado */}
          {selectedPlanet ? (
            <PlanetFullCard
              planet={selectedPlanet}
              isOriginPlanet={effectiveOriginCode === selectedPlanet.code}
              isCurrentPlanet={game.universe.currentPlanetCode === selectedPlanet.code}
              titlePrefix={`Cuadrante ${selectedQuadKey}`}
            />
          ) : selectedQuad?.isConfigured ? (
            /* Cuadrante configurado sin planeta */
            <div className="bg-space-900 border border-space-800 rounded-2xl p-6 text-center space-y-2 shadow-xl">
              <Globe className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200">Cuadrante {selectedQuadKey}: Espacio Vacío</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Este cuadrante ha sido configurado pero no contiene ningún planeta habitable ni estación orbital.
              </p>
            </div>
          ) : (
            /* Cuadrante en niebla de guerra */
            <div className="bg-space-900 border border-space-800 rounded-2xl p-6 text-center space-y-3 shadow-xl">
              <Radio className="w-8 h-8 text-slate-600 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-200">Cuadrante {selectedQuadKey} sin explorar</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Oculto bajo la niebla de guerra espacial. Puedes enviar al ingeniero computacional para mapear el cuadrante.
                </p>
              </div>

              {selectedQuad && (
                <button
                  type="button"
                  onClick={() => handleConfigureQuadrant(selectedQuad.col, selectedQuad.row)}
                  className="px-4 py-2 bg-space-accent text-space-950 font-bold rounded-xl hover:bg-sky-400 transition-colors shadow text-xs"
                >
                  Configurar Cuadrante (1 día)
                </button>
              )}
            </div>
          )}

          {/* Panel de Consulta Rápida de Planetas Descubiertos en este Sector */}
          <DiscoveredPlanetsPanel
            discoveredCodes={viewedArea?.discoveredPlanets || []}
            selectedPlanetCode={selectedPlanet?.code || null}
            originPlanetCode={effectiveOriginCode || undefined}
            currentPlanetCode={game.universe.currentPlanetCode}
            onSelectPlanetCode={handleSelectDiscoveredPlanet}
          />
        </div>

      </div>

      {/* Modales de Maniobra de Vuelo y Amarre en Espaciopuerto */}
      {currentPlanet && (
        <>
          <FlightManeuverModal
            isOpen={isManeuverModalOpen}
            onClose={() => setIsManeuverModalOpen(false)}
            game={game}
            planet={currentPlanet}
            targetManeuver={targetManeuver}
            onUpdateGame={onUpdateGame}
          />

          <SpaceportDockingModal
            isOpen={isDockingModalOpen}
            onClose={() => setIsDockingModalOpen(false)}
            game={game}
            planet={currentPlanet}
            onUpdateGame={onUpdateGame}
          />
        </>
      )}

    </div>
  );
}
