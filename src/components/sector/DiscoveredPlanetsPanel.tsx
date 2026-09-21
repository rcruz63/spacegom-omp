import { PLANETS_BY_CODE } from '../../engine/universe';
import { 
  Globe, 
  Star, 
  Rocket, 
  ChevronRight, 
  Building2 
} from 'lucide-react';

interface DiscoveredPlanetsPanelProps {
  discoveredCodes: number[];
  selectedPlanetCode: number | null;
  originPlanetCode?: number;
  currentPlanetCode?: number | null;
  onSelectPlanetCode: (code: number) => void;
}

export function DiscoveredPlanetsPanel({
  discoveredCodes,
  selectedPlanetCode,
  originPlanetCode,
  currentPlanetCode,
  onSelectPlanetCode
}: DiscoveredPlanetsPanelProps) {
  if (discoveredCodes.length === 0) {
    return (
      <div className="p-4 bg-space-950 border border-space-800 rounded-xl text-center text-xs text-slate-500">
        No se han descubierto mundos en este sector todavía.
      </div>
    );
  }

  return (
    <div className="bg-space-900 border border-space-700 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-space-800">
        <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-space-accent" />
          <span>Mundos Descubiertos en este Sector ({discoveredCodes.length})</span>
        </h4>
        <span className="text-[10px] text-slate-500">Haz clic para consultar</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {discoveredCodes.map(code => {
          const planet = PLANETS_BY_CODE[code];
          if (!planet) return null;

          const isSelected = selectedPlanetCode === code;
          const isOrigin = originPlanetCode === code;
          const isCurrent = currentPlanetCode === code;

          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelectPlanetCode(code)}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-space-800 border-space-accent ring-1 ring-space-accent text-slate-100 shadow'
                  : 'bg-space-950 border-space-800 hover:border-space-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isOrigin ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'bg-space-900 text-space-accent border border-space-700'
                }`}>
                  <Globe className="w-3.5 h-3.5" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-bold text-slate-100">{planet.name}</strong>
                    <span className="text-[10px] font-mono text-slate-400">#{planet.code}</span>
                    {isOrigin && (
                      <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600 font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>Base</span>
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold flex items-center gap-0.5">
                        <Rocket className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Aquí</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Espaciopuerto: {planet.spaceport_quality || 'MED'} · Combustible: {planet.fuel_density || 'DM'} · Amarre: {planet.docking_price} SC
                  </div>
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-space-accent translate-x-0.5' : 'text-slate-600'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
