import React from 'react';
import { SectorArea, UniverseState } from '../../types/universe';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { 
  Rocket, 
  Star, 
  Globe, 
  EyeOff, 
  Radio, 
  Compass
} from 'lucide-react';

interface SectorGridMapProps {
  viewedArea: SectorArea | undefined;
  viewedAreaId: number;
  universe: UniverseState;
  selectedQuadKey: string;
  onSelectQuadrantKey: (key: string) => void;
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4, 5, 6];

export function SectorGridMap({
  viewedArea,
  viewedAreaId,
  universe,
  selectedQuadKey,
  onSelectQuadrantKey
}: SectorGridMapProps) {
  const isShipInThisArea = universe.currentAreaId === viewedAreaId;

  const getLocationBadge = (loc: UniverseState['currentLocation']) => {
    switch (loc) {
      case 'mundo': return { label: 'Mundo', bg: 'bg-emerald-950 text-emerald-300 border-emerald-700' };
      case 'espaciopuerto': return { label: 'Puerto', bg: 'bg-amber-950 text-amber-300 border-amber-700' };
      case 'instalacion_orbital': return { label: 'Orbital', bg: 'bg-indigo-950 text-indigo-300 border-indigo-700' };
      case 'estacion_hiperdisparo': return { label: 'Hiper', bg: 'bg-sky-950 text-sky-300 border-sky-700' };
      default: return { label: 'Tránsito', bg: 'bg-space-900 text-slate-300 border-space-700' };
    }
  };

  if (!viewedArea) {
    return (
      <div className="bg-space-950 border border-space-800 rounded-2xl p-12 text-center space-y-3 relative overflow-hidden shadow-2xl">
        {/* Fondo con estrellas tenues */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        <div className="relative z-10 space-y-2 max-w-md mx-auto">
          <EyeOff className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">Sector {viewedAreaId} Inexplorado</h3>
          <p className="text-xs text-slate-400">
            No dispones de registros cartográficos para este sector interestelar.
            Para explorarlo, realiza un hipersalto desde un sector adyacente o adquiere datos en un Centro Cartográfico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-space-950 border border-space-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
      {/* Fondo Cósmico Estrellado con Nebulosa y Estrellas */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-space-900 via-space-950 to-black opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:48px_48px] opacity-20" />

      {/* Contenido en primer plano */}
      <div className="relative z-10 w-full max-w-2xl">
        
        {/* Leyenda y Título del Mapa */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-space-800/80 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-space-accent" />
            <span className="font-bold text-slate-200">Cuadrícula Cartográfica 6x6</span>
            <span className="text-slate-500 font-mono">(Área {viewedAreaId})</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-space-accent inline-block" />
              <span>Planeta</span>
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Base Origen</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800 inline-block" />
              <span>Niebla de Guerra</span>
            </span>
          </div>
        </div>

        {/* Grid con Cabeceras EXTERNAS */}
        <div className="flex justify-center">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            
            {/* Esquina superior izquierda vacía */}
            <div className="w-16 h-8 flex items-center justify-center font-mono font-bold text-slate-600 text-xs">
              SEC
            </div>

            {/* Cabecera Superior: Columnas A a F */}
            {COLS.map(col => (
              <div 
                key={col} 
                className="w-20 h-8 flex items-center justify-center font-mono font-black text-space-accent text-sm tracking-widest bg-space-900/60 border border-space-800/80 rounded-lg shadow-inner"
              >
                {col}
              </div>
            ))}

            {/* Filas 1 a 6 con Cabecera Lateral Izquierda */}
            {ROWS.map(row => (
              <React.Fragment key={row}>
                {/* Cabecera Lateral: Fila 1 a 6 */}
                <div className="w-16 h-20 flex items-center justify-center font-mono font-black text-space-accent text-sm bg-space-900/60 border border-space-800/80 rounded-lg shadow-inner">
                  {row}
                </div>

                {/* Celdas de Cuadrantes A1 a F6 */}
                {COLS.map(col => {
                  const quadKey = `${col}${row}`;
                  const quad = viewedArea.quadrants[quadKey];
                  const planet = quad?.planetCode ? PLANETS_BY_CODE[quad.planetCode] : null;

                  const isSelected = selectedQuadKey === quadKey;
                  const isShipHere = isShipInThisArea && universe.currentCol === col && universe.currentRow === row;
                  const isOriginPlanet = planet && universe.originPlanetCode === planet.code;
                  const isConfigured = quad?.isConfigured;

                  return (
                    <button
                      key={quadKey}
                      type="button"
                      onClick={() => onSelectQuadrantKey(quadKey)}
                      className={`w-20 h-20 rounded-xl p-1.5 transition-all flex flex-col justify-between text-left relative overflow-hidden group ${
                        isSelected 
                          ? 'ring-2 ring-space-accent shadow-lg shadow-space-accent/25 z-20 scale-105 bg-space-800/90 border-space-accent'
                          : isShipHere
                            ? 'ring-1 ring-emerald-400 bg-space-900/90 border-emerald-700/80'
                            : isConfigured
                              ? 'bg-space-900/80 border border-space-700/70 hover:border-space-500 hover:bg-space-800/60'
                              : 'bg-black/70 border border-space-800/40 hover:border-space-700/60'
                      }`}
                    >
                      {/* NIEBLA DE GUERRA (Si no está configurado) */}
                      {!isConfigured ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1 select-none">
                          <div className="w-6 h-6 rounded-full bg-space-950/80 border border-dashed border-space-800 flex items-center justify-center">
                            <Radio className="w-3 h-3 text-slate-600 group-hover:text-space-accent transition-colors" />
                          </div>
                          <span className="text-[9px] font-mono tracking-tighter text-slate-600 group-hover:text-slate-400">
                            Niebla
                          </span>
                        </div>
                      ) : (
                        /* CUADRANTE EXPLORADO */
                        <>
                          {/* Top Bar: Código de Planeta o Espacio Vacío */}
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              {quadKey}
                            </span>

                            {isOriginPlanet && (
                              <span title="Planeta Natal / Base de Origen">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow" />
                              </span>
                            )}
                          </div>

                          {/* Centro: Icono del Planeta o Vacío */}
                          <div className="flex flex-col items-center justify-center my-auto">
                            {planet ? (
                              <>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md relative ${
                                  isOriginPlanet 
                                    ? 'bg-amber-950 border-2 border-amber-400 text-amber-300' 
                                    : 'bg-sky-950 border border-sky-400 text-space-accent'
                                }`}>
                                  <Globe className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-100 truncate max-w-[70px] mt-0.5">
                                  #{planet.code}
                                </span>
                              </>
                            ) : (
                              <span className="text-[9px] text-slate-600 italic">
                                Vacío
                              </span>
                            )}
                          </div>

                          {/* Indicador de la Astronave en la Celda */}
                          {isShipHere && (
                            <div className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 py-0.5 rounded bg-emerald-950/90 border border-emerald-600/80 shadow-md">
                              <Rocket className="w-3 h-3 text-emerald-300 animate-pulse shrink-0" />
                              <span className="text-[9px] font-bold text-emerald-200">
                                {getLocationBadge(universe.currentLocation).label}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
