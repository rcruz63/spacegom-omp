import { INITIAL_CREW_ROSTER_TEMPLATE, getDifficultyTreasury } from '../../engine/company';
import { Users, RefreshCw } from 'lucide-react';
import { PlanetData } from '../../types/universe';

interface SetupStepCrewProps {
  crewNames: string[];
  totalCrewSalary: number;
  companyName: string;
  shipName: string;
  difficulty: 'facil' | 'normal' | 'dificil';
  areaRoll: number;
  startCol: string;
  startRow: number;
  density: 'Baja' | 'Media' | 'Alta';
  activePlanet: PlanetData;
  onShuffleCrewNames: () => void;
}

export function SetupStepCrew({
  crewNames,
  totalCrewSalary,
  companyName,
  shipName,
  difficulty,
  areaRoll,
  startCol,
  startRow,
  density,
  activePlanet,
  onShuffleCrewNames
}: SetupStepCrewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-space-accent" />
            Personal Inicial: 11 Empleados Creados Automáticamente (76 SC/mes)
          </h3>
          <p className="text-xs text-slate-400">
            Se han asignado 11 nombres únicos desde la base de datos de personal sin repetición en la partida.
          </p>
        </div>

        <button
          type="button"
          onClick={onShuffleCrewNames}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-space-800 border border-space-600 rounded-lg text-xs font-bold text-space-accent hover:bg-space-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reasignar Nombres Aleatorios</span>
        </button>
      </div>

      {/* Tabla de los 11 Empleados */}
      <div className="bg-space-950 border border-space-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-space-900 border-b border-space-800 text-slate-400 uppercase font-semibold">
            <tr>
              <th className="py-2.5 px-4">#</th>
              <th className="py-2.5 px-4">Puesto / Cargo</th>
              <th className="py-2.5 px-4">Nombre Asignado</th>
              <th className="py-2.5 px-4 text-right">Salario</th>
              <th className="py-2.5 px-4">Experiencia</th>
              <th className="py-2.5 px-4">Moral</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-800/60 text-slate-300">
            {INITIAL_CREW_ROSTER_TEMPLATE.map((template, idx) => {
              const name = crewNames[idx] || template.defaultName;
              return (
                <tr key={idx} className="hover:bg-space-900/40">
                  <td className="py-2 px-4 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="py-2 px-4 font-medium text-slate-200">{template.position}</td>
                  <td className="py-2 px-4 text-space-accent font-semibold">{name}</td>
                  <td className="py-2 px-4 text-right font-mono text-amber-300 font-bold">{template.monthlySalary} SC</td>
                  <td className="py-2 px-4 capitalize">{template.experience}</td>
                  <td className="py-2 px-4 capitalize">{template.morale}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-space-900 border-t border-space-800 font-bold text-slate-200">
            <tr>
              <td colSpan={3} className="py-2.5 px-4 text-right uppercase text-[11px] text-slate-400">
                Total Salarios Mensuales:
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-amber-400 text-sm">
                {totalCrewSalary} SC / mes
              </td>
              <td colSpan={2} className="py-2.5 px-4 text-emerald-400 text-[11px]">
                Exacto según reglamento
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tarjeta de Resumen Final */}
      <div className="p-4 bg-space-950 border border-space-700 rounded-xl space-y-2 text-xs">
        <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
          Resumen de Campaña Lista para Iniciar
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
          <div>
            <span className="text-slate-500 block text-[11px]">Compañía:</span>
            <strong className="text-slate-100">{companyName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Nave:</span>
            <strong className="text-slate-100">{shipName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Tesorería Inicial:</span>
            <strong className="text-amber-400">{getDifficultyTreasury(difficulty)} SC ({difficulty.toUpperCase()})</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Ubicación Inicial:</span>
            <strong className="text-sky-400">Área {areaRoll}, Cuadrante {startCol}{startRow} ({density})</strong>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block text-[11px]">Planeta Base de Origen:</span>
            <strong className="text-emerald-400">{activePlanet.name} (#{activePlanet.code})</strong>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block text-[11px]">Tripulación Activa:</span>
            <strong className="text-slate-100">11 miembros ({totalCrewSalary} SC/mes)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
