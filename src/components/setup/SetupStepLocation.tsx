import React from 'react';
import { MapPin } from 'lucide-react';
import { DiceRollerVisual } from '../common/DiceRollerVisual';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4, 5, 6];

interface SetupStepLocationProps {
  difficulty: 'facil' | 'normal' | 'dificil';
  areaDice: [number, number];
  densityDice: [number, number];
  areaRoll: number;
  densityRoll: number;
  density: 'Baja' | 'Media' | 'Alta';
  startCol: string;
  startRow: number;
  onAreaDiceChange: (dice: [number, number]) => void;
  onDensityDiceChange: (dice: [number, number]) => void;
  onSelectQuadrant: (col: string, row: number) => void;
}

export function SetupStepLocation({
  difficulty,
  areaDice,
  densityDice,
  areaRoll,
  densityRoll,
  density,
  startCol,
  startRow,
  onAreaDiceChange,
  onDensityDiceChange,
  onSelectQuadrant
}: SetupStepLocationProps) {
  const canReroll = difficulty === 'facil';

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
          {/* Área Espacial (2D6) */}
          <DiceRollerVisual
            diceCount={2}
            values={areaDice}
            title="Área Espacial (2D6: 2-12)"
            subtitle="Determina el sector estelar inicial de la campaña"
            resultLabel="Área Asignada"
            resultValue={`Área ${areaRoll}`}
            canReroll={canReroll}
            blockedMessage="En dificultad Normal/Difícil no está permitido relanzar el Área."
            onRollComplete={vals => onAreaDiceChange([vals[0], vals[1]])}
            onManualChange={vals => onAreaDiceChange([vals[0], vals[1]])}
          />

          {/* Densidad de Mundos (2D6) */}
          <DiceRollerVisual
            diceCount={2}
            values={densityDice}
            title="Densidad de Mundos (2D6)"
            subtitle="≤4: Baja | 5-9: Media | ≥10: Alta"
            resultLabel="Clasificación"
            resultValue={`Densidad ${density} (${densityRoll})`}
            canReroll={canReroll}
            blockedMessage="En dificultad Normal/Difícil no está permitido relanzar la Densidad."
            onRollComplete={vals => onDensityDiceChange([vals[0], vals[1]])}
            onManualChange={vals => onDensityDiceChange([vals[0], vals[1]])}
          />
        </div>

        {/* Grid 6x6 Interactivo para Cuadrante Inicial */}
        <div className="p-4 bg-space-950 border border-space-800 rounded-xl flex flex-col items-center justify-center">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-xs uppercase font-bold text-slate-300">
              Cuadrante Inicial: <strong className="text-space-accent text-sm ml-1">{startCol}{startRow}</strong>
            </span>
            <span className="text-[10px] text-slate-500">Haz clic o selecciona tu posición:</span>
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
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                        isSelected
                          ? 'bg-space-accent text-space-950 ring-2 ring-sky-300 shadow-md scale-105'
                          : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-space-500 hover:text-slate-100'
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
