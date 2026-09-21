import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { DiceRollerVisual } from '../common/DiceRollerVisual';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4, 5, 6];

interface SetupStepLocationProps {
  difficulty: 'facil' | 'normal' | 'dificil';
  areaDice: [number, number] | null;
  densityDice: [number, number] | null;
  quadrantDice: [number, number] | null;
  isAreaRolled: boolean;
  isDensityRolled: boolean;
  isQuadrantRolled: boolean;
  areaRoll: number | null;
  densityRoll: number | null;
  density: 'Baja' | 'Media' | 'Alta' | null;
  startCol: string | null;
  startRow: number | null;
  onAreaDiceChange: (dice: [number, number]) => void;
  onDensityDiceChange: (dice: [number, number]) => void;
  onQuadrantDiceChange: (dice: [number, number]) => void;
}

export function SetupStepLocation({
  difficulty,
  areaDice,
  densityDice,
  quadrantDice,
  isAreaRolled,
  isDensityRolled,
  isQuadrantRolled,
  areaRoll,
  densityRoll,
  density,
  startCol,
  startRow,
  onAreaDiceChange,
  onDensityDiceChange,
  onQuadrantDiceChange
}: SetupStepLocationProps) {
  const canReroll = difficulty === 'facil';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-space-accent" />
          Determinación de Área, Densidad y Cuadrante Inicial
        </h3>
        <p className="text-xs text-slate-400">
          Efectúa las tiradas reglamentarias de dados para determinar tu posición en la galaxia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna 1: Tiradas de Área, Densidad y Cuadrante */}
        <div className="space-y-4">
          {/* 1. Área Espacial (2D6) */}
          <DiceRollerVisual
            diceCount={2}
            values={areaDice}
            isRolled={isAreaRolled}
            title="1. Área Espacial (2D6: 2-12)"
            subtitle="Determina el sector estelar inicial de la campaña"
            resultLabel="Área"
            resultValue={areaRoll !== null ? `Área ${areaRoll}` : undefined}
            canReroll={canReroll}
            blockedMessage="En dificultad Normal/Difícil no está permitido relanzar el Área."
            onRollComplete={vals => onAreaDiceChange([vals[0], vals[1]])}
            onManualChange={vals => onAreaDiceChange([vals[0], vals[1]])}
          />

          {/* 2. Densidad de Mundos (2D6) */}
          <DiceRollerVisual
            diceCount={2}
            values={densityDice}
            isRolled={isDensityRolled}
            title="2. Densidad de Mundos (2D6)"
            subtitle="≤4: Baja | 5-9: Media | ≥10: Alta"
            resultLabel="Densidad"
            resultValue={density && densityRoll !== null ? `${density} (${densityRoll})` : undefined}
            canReroll={canReroll}
            blockedMessage="En dificultad Normal/Difícil no está permitido relanzar la Densidad."
            onRollComplete={vals => onDensityDiceChange([vals[0], vals[1]])}
            onManualChange={vals => onDensityDiceChange([vals[0], vals[1]])}
          />

          {/* 3. Cuadrante Inicial (2D6: 1D6 Columna + 1D6 Fila) */}
          <DiceRollerVisual
            diceCount={2}
            values={quadrantDice}
            isRolled={isQuadrantRolled}
            title="3. Posición Inicial (2D6: Columna y Fila)"
            subtitle="Dado 1: Columna A-F (1=A...6=F) | Dado 2: Fila 1-6"
            resultLabel="Cuadrante"
            resultValue={startCol && startRow ? `${startCol}${startRow}` : undefined}
            canReroll={canReroll}
            blockedMessage="En dificultad Normal/Difícil no está permitido relanzar el Cuadrante."
            customValueFormatter={(val, idx) => {
              if (idx === 0) return COLS[val - 1] || 'A';
              return String(val);
            }}
            onRollComplete={vals => onQuadrantDiceChange([vals[0], vals[1]])}
            onManualChange={vals => onQuadrantDiceChange([vals[0], vals[1]])}
          />
        </div>

        {/* Columna 2: Visualizador de Posición en Grid 6x6 (Solo lectura) */}
        <div className="p-4 bg-space-950 border border-space-800 rounded-xl flex flex-col items-center justify-center">
          <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-space-800">
            <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-space-accent" />
              <span>Posición en el Grid 6x6:</span>
              <strong className="text-space-accent text-sm ml-1">
                {startCol && startRow ? `${startCol}${startRow}` : 'Sin determinar'}
              </strong>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {isQuadrantRolled ? 'Determinada por tirada' : 'Pendiente de tirada'}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs my-2">
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
                  const isCurrentPosition = startCol === c && startRow === r;
                  return (
                    <div
                      key={`${c}${r}`}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                        isCurrentPosition
                          ? 'bg-space-accent text-space-950 ring-2 ring-sky-300 shadow-lg shadow-space-accent/20 scale-105'
                          : 'bg-slate-900/60 border border-slate-800 text-slate-500'
                      }`}
                    >
                      {c}{r}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 text-center mt-2">
            El cuadrante inicial queda fijado exclusivamente por la tirada de dados de Columna (1-6) y Fila (1-6).
          </p>
        </div>
      </div>
    </div>
  );
}
