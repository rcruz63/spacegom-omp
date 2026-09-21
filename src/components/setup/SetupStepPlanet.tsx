import { PlanetData } from '../../types/universe';
import { PlanetValidationResult, ConsecutiveSearchDetails } from '../../engine/universe';
import { Globe, Dices, AlertTriangle, CheckCircle2, XCircle, Edit3 } from 'lucide-react';

interface SetupStepPlanetProps {
  dice3D6: [number, number, number];
  rawRolledCode: number;
  activePlanet: PlanetData;
  activeValidation: PlanetValidationResult;
  consecutiveDetails: ConsecutiveSearchDetails;
  onRollPlanet: () => void;
  onOpenEditPlanet: () => void;
}

export function SetupStepPlanet({
  dice3D6,
  rawRolledCode,
  activePlanet,
  activeValidation,
  consecutiveDetails,
  onRollPlanet,
  onOpenEditPlanet
}: SetupStepPlanetProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
            <Globe className="w-5 h-5 text-space-accent" />
            Planeta de Origen: Tirada 3D6 y Validación Automática
          </h3>
          <p className="text-xs text-slate-400">
            Se lanza 3d6 (111-666) para determinar el código. Si no es apto, la búsqueda consecutiva encuentra el siguiente planeta reglamentario.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRollPlanet}
            className="flex items-center gap-2 px-3 py-2 bg-space-accent text-space-950 font-bold rounded-lg text-xs hover:bg-sky-400 transition-colors shadow"
          >
            <Dices className="w-4 h-4" />
            <span>Lanzar 3D6</span>
          </button>
        </div>
      </div>

      {/* Resultado de los dados */}
      <div className="p-4 bg-space-950 border border-space-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-semibold text-slate-400">
            Dados 3D6:
          </span>
          <div className="flex items-center gap-2">
            {dice3D6.map((d, i) => (
              <span key={i} className="w-8 h-8 rounded-lg bg-space-800 border border-space-600 flex items-center justify-center text-slate-100 font-bold text-sm shadow-inner">
                {d}
              </span>
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-400">
            → Código Tirado: <strong className="text-slate-100 text-base">#{rawRolledCode}</strong>
          </span>
        </div>

        {consecutiveDetails.stepsCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Código #{rawRolledCode} no apto. <strong>Búsqueda Consecutiva:</strong> asignado #{activePlanet.code} (+{consecutiveDetails.stepsCount} pasos).
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>El planeta sacado #{rawRolledCode} cumple directamente todos los requisitos.</span>
          </div>
        )}
      </div>

      {/* Tarjeta del Planeta Seleccionado */}
      <div className="p-5 bg-space-950 border border-space-700 rounded-xl">
        <div className="flex items-start justify-between pb-4 border-b border-space-800">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xl font-black text-slate-100">{activePlanet.name}</h4>
              <span className="px-2.5 py-0.5 bg-space-800 border border-space-600 rounded text-xs font-mono font-bold text-space-accent">
                Código #{activePlanet.code}
              </span>
              {activePlanet.is_custom === 1 && (
                <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-700 rounded text-[10px] font-bold text-indigo-300">
                  Editado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Espaciopuerto: <strong className="text-slate-200">{activePlanet.spaceport_quality || 'MED'}</strong> · 
              Atraque: <strong className="text-slate-200">{activePlanet.docking_price} SC</strong> · 
              Días a Hiperdisparo: <strong className="text-slate-200">{activePlanet.days_to_hyperspace}d</strong> · 
              Orden Legal: <strong className="text-slate-200">{activePlanet.legal_order_threshold}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenEditPlanet}
            className="flex items-center gap-1.5 text-xs text-space-accent hover:text-sky-300 px-3 py-1.5 bg-space-800 border border-space-600 rounded-lg font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Actualizar Datos</span>
          </button>
        </div>

        {/* 5 Requisitos Reglamentarios de Inicio */}
        <div className="mt-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-3">
            Validación de Requisitos de Inicio Spacegom
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'population', check: activeValidation.checks.population },
              { key: 'technology', check: activeValidation.checks.technology },
              { key: 'lifeSupport', check: activeValidation.checks.lifeSupport },
              { key: 'convenio', check: activeValidation.checks.convenio },
              { key: 'products', check: activeValidation.checks.products }
            ].map(item => (
              <div 
                key={item.key}
                className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                  item.check.passed 
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' 
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}
              >
                {item.check.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold">{item.check.label}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{item.check.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Si hubo salto consecutivo, mostrar trazabilidad */}
        {consecutiveDetails.stepsCount > 0 && (
          <div className="mt-4 pt-3 border-t border-space-800/80 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Trazabilidad de descarte: </span>
            {consecutiveDetails.sequenceVisited.map(v => (
              <span key={v.code} className="inline-block mr-2">
                #{v.code} ({v.name}: {v.reasons.join(', ')}) →
              </span>
            ))}
            <span className="text-emerald-400 font-bold">#{activePlanet.code} ({activePlanet.name}) Apto</span>
          </div>
        )}
      </div>
    </div>
  );
}
