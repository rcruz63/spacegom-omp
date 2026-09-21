import { UniverseState } from '../../types/universe';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { 
  Compass, 
  ChevronLeft, 
  ChevronRight, 
  Rocket, 
  Star, 
  Fuel, 
  Navigation,
  Eye
} from 'lucide-react';

interface SectorNavigationHeaderProps {
  currentAreaId: number;
  viewedAreaId: number;
  universe: UniverseState;
  fuelCurrent: number;
  onViewAreaChange: (areaId: number) => void;
  onJumpToSector: (targetAreaId: number) => void;
}

const ALL_SECTOR_IDS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function SectorNavigationHeader({
  currentAreaId,
  viewedAreaId,
  universe,
  fuelCurrent,
  onViewAreaChange,
  onJumpToSector
}: SectorNavigationHeaderProps) {
  const viewedArea = universe.areas[viewedAreaId];
  const isShipInViewedArea = currentAreaId === viewedAreaId;
  const isExplored = Boolean(viewedArea);

  // Datos del Planeta de Origen
  const originPlanetCode = universe.originPlanetCode;
  const originPlanet = originPlanetCode ? PLANETS_BY_CODE[originPlanetCode] : null;

  // Comprobar si se puede efectuar hipersalto al sector visualizado (debe ser adyacente +-1 y la nave en estación de hiperdisparo)
  const isAdjacent = Math.abs(viewedAreaId - currentAreaId) === 1;
  const isAtHyperspace = universe.currentLocation === 'estacion_hiperdisparo';
  const canJumpToViewedSector = !isShipInViewedArea && isAdjacent && isAtHyperspace && fuelCurrent >= 1;

  return (
    <div className="space-y-3">
      {/* Barra Permanente de Planeta de Origen y Base */}
      {originPlanet && (
        <div className="px-4 py-2 bg-gradient-to-r from-amber-950/40 via-space-900 to-space-950 border border-amber-800/50 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            <span>
              Base de Origen / Planeta Natal: <strong className="text-slate-100 font-bold">{originPlanet.name}</strong>{' '}
              <span className="font-mono text-amber-400 font-semibold">(#{originPlanet.code})</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Sector {universe.originAreaId || currentAreaId}</span>
            <span>Cuadrante {universe.originCol || 'C'}{universe.originRow || 4}</span>
            <span className="text-emerald-400 font-semibold">Soporte Vital: {originPlanet.life_support}</span>
          </div>
        </div>
      )}

      {/* Selector de Sectores (2 al 12) */}
      <div className="bg-space-800 border border-space-700 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Navegación Izquierda: Anterior y Título */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={viewedAreaId <= 2}
            onClick={() => onViewAreaChange(viewedAreaId - 1)}
            className="p-2 rounded-lg bg-space-900 border border-space-700 text-slate-300 hover:text-white hover:bg-space-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Sector Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-space-accent" />
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                Sector / Área {viewedAreaId}
              </h2>
              {isShipInViewedArea ? (
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Rocket className="w-3 h-3 text-emerald-400" />
                  <span>Astronave Aquí</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-space-900 border border-space-700 text-slate-400 rounded-full text-[10px] flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>Visualizando</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {isExplored ? (
                <>
                  Densidad: <strong className="text-space-accent">{viewedArea?.density}</strong> ·{' '}
                  <span>{viewedArea?.discoveredPlanets.length || 0} mundos descubiertos</span>
                </>
              ) : (
                <span className="text-amber-400/90 italic">Sector inexplorado (sin datos cartográficos)</span>
              )}
            </p>
          </div>
        </div>

        {/* Píldoras de Sectores 2 al 12 */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {ALL_SECTOR_IDS.map(id => {
            const hasArea = Boolean(universe.areas[id]);
            const isCurrent = id === currentAreaId;
            const isViewed = id === viewedAreaId;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onViewAreaChange(id)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative ${
                  isViewed
                    ? 'bg-space-accent text-space-950 ring-2 ring-sky-300 shadow scale-105'
                    : isCurrent
                      ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600'
                      : hasArea
                        ? 'bg-space-900 text-slate-200 border border-space-700 hover:bg-space-700'
                        : 'bg-space-950/60 text-slate-600 border border-space-800 hover:text-slate-400'
                }`}
                title={`Sector ${id}${isCurrent ? ' (Nave aquí)' : ''}${hasArea ? ' (Explorado)' : ' (Inexplorado)'}`}
              >
                <span>{id}</span>
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}

          <button
            type="button"
            disabled={viewedAreaId >= 12}
            onClick={() => onViewAreaChange(viewedAreaId + 1)}
            className="p-2 rounded-lg bg-space-900 border border-space-700 text-slate-300 hover:text-white hover:bg-space-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
            title="Sector Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hipersalto a Sector Adyacente */}
        <div className="flex items-center gap-2">
          {canJumpToViewedSector && (
            <button
              type="button"
              onClick={() => onJumpToSector(viewedAreaId)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Hipersalto a Sector {viewedAreaId} (-1 comb, +1d)</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono bg-space-900 px-3 py-2 rounded-xl border border-space-700">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">{fuelCurrent} U. Combustible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
