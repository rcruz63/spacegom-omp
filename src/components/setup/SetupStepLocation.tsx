import React from 'react';
import { MapPin, Dices } from 'lucide-react';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4, 5, 6];

interface SetupStepLocationProps {
  areaRoll: number;
  densityRoll: number;
  density: 'Baja' | 'Media' | 'Alta';
  startCol: string;
  startRow: number;
  onRollArea: () => void;
  onRollDensity: () => void;
  onRollQuadrant: () => void;
  onSelectQuadrant: (col: string, row: number) => void;
}

export function SetupStepLocation({
  areaRoll,
  densityRoll,
  density,
  startCol,
  startRow,
  onRollArea,
  onRollDensity,
  onRollQuadrant,
  onSelectQuadrant
}: SetupStepLocationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-space-accent" />
          Determinación de Área y Posición Inicial
        </h3>
        <p className="text-xs text-slate-400">
          Efectúa tiradas de 2d6 para determinar el área espacial y la densidad de mundos, y sitúa tu nave en el cuadrante inicial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tiradas de Área y Densidad */}
        <div className="space-y-4">
          {/* Área Espacial */}
          <div className="p-4 bg-space-950 border border-space-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-slate-300">
                Área Espacial (2D6: 2-12)
              </span>
              <button
                type="button"
                onClick={onRollArea}
                className="flex items-center gap-1.5 text-xs text-space-accent hover:text-sky-300 font-bold bg-space-800/80 px-2.5 py-1 rounded-lg border border-space-700"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Tirar 2D6</span>
              </button>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-100">
                Área {areaRoll}
              </span>
              <span className="text-xs text-slate-400">
                (Sector Interestelar asignado)
              </span>
            </div>
          </div>

          {/* Densidad de Mundos */}
          <div className="p-4 bg-space-950 border border-space-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-slate-300">
                Densidad de Mundos (2D6)
              </span>
              <button
                type="button"
                onClick={onRollDensity}
                className="flex items-center gap-1.5 text-xs text-space-accent hover:text-sky-300 font-bold bg-space-800/80 px-2.5 py-1 rounded-lg border border-space-700"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Tirar 2D6</span>
              </button>
            </div>
            <div className="flex items-baseline gap-3">
              <span className={`text-2xl font-black ${
                density === 'Baja' ? 'text-amber-400' : density === 'Media' ? 'text-sky-400' : 'text-emerald-400'
              }`}>
                Densidad {density}
              </span>
              <span className="text-xs text-slate-400">
                (Tirada: {densityRoll} → {densityRoll <= 4 ? '≤4 Baja' : densityRoll <= 9 ? '5-9 Media' : '≥10 Alta'})
              </span>
            </div>
          </div>

          {/* Cuadrante inicial botón tirar */}
          <div className="p-4 bg-space-950 border border-space-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-300 block mb-0.5">
                Cuadrante Inicial
              </span>
              <span className="text-2xl font-black text-space-accent">
                {startCol}{startRow}
              </span>
            </div>
            <button
              type="button"
              onClick={onRollQuadrant}
              className="flex items-center gap-1.5 text-xs text-space-accent hover:text-sky-300 font-bold bg-space-800/80 px-3 py-1.5 rounded-lg border border-space-700"
            >
              <Dices className="w-4 h-4" />
              <span>Tirar 1D6/1D6</span>
            </button>
          </div>
        </div>

        {/* Grid 6x6 Interactivo */}
        <div className="p-4 bg-space-950 border border-space-800 rounded-xl flex flex-col items-center justify-center">
          <div className="text-xs text-slate-400 font-semibold mb-3">
            Selecciona o haz clic en la cuadrícula 6x6:
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            <div className="w-9 h-7 flex items-center justify-center font-bold text-slate-500"></div>
            {COLS.map(c => (
              <div key={c} className="w-9 h-7 flex items-center justify-center font-bold text-slate-400">
                {c}
              </div>
            ))}

            {ROWS.map(r => (
              <React.Fragment key={r}>
                <div className="w-9 h-9 flex items-center justify-center font-bold text-slate-400">
                  {r}
                </div>
                {COLS.map(c => {
                  const isSelected = startCol === c && startRow === r;
                  return (
                    <button
                      key={`${c}${r}`}
                      type="button"
                      onClick={() => onSelectQuadrant(c, r)}
                      className={`w-9 h-9 rounded flex items-center justify-center font-bold transition-all ${
                        isSelected
                          ? 'bg-space-accent text-space-950 ring-2 ring-sky-300 shadow-md scale-105'
                          : 'bg-space-900 border border-space-800 text-slate-400 hover:border-space-600 hover:text-slate-200'
                      }`}
                    >
                      {c}{r}
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
