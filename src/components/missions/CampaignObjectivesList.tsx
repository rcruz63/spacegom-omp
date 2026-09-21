import { useMemo } from 'react';
import { CampaignObjective, MissionStatus } from '../../types/missions';
import { CompanyState } from '../../types/company';
import { checkObjective1Progress } from '../../engine/missions';
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  UserCheck, 
  UserX,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface CampaignObjectivesListProps {
  objectives: CampaignObjective[];
  company: CompanyState;
  currentPlanetName: string;
  onActivateObjective1: () => void;
  onUpdateStatus: (id: string, status: MissionStatus) => void;
}

export function CampaignObjectivesList({
  objectives,
  company,
  currentPlanetName,
  onActivateObjective1,
  onUpdateStatus
}: CampaignObjectivesListProps) {
  const objective1 = useMemo(() => {
    return objectives.find(o => o.objectiveNumber === 1);
  }, [objectives]);

  const obj1Progress = useMemo(() => {
    return checkObjective1Progress(company);
  }, [company]);

  return (
    <div className="space-y-6">
      {/* Banner para activar el Objetivo nº 1 si aún no está registrado */}
      {!objective1 && (
        <div className="p-5 bg-gradient-to-r from-amber-950/40 via-space-900 to-space-950 border border-amber-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3 max-w-xl">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Hilo Narrativo del Libro de Campaña
              </span>
              <h4 className="text-base font-bold text-slate-100 mt-0.5">
                Objetivo nº 1: Contratación de Plantilla Básica
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                El manual requiere contratar a 6 profesionales clave para comenzar a operar: Responsable de pasajeros, Auxiliar de vuelo, Negociador de mercadería, Técnico de astronaves, Técnico de soporte vital y Abogado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onActivateObjective1}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-space-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Activar Objetivo nº 1 en {currentPlanetName}</span>
          </button>
        </div>
      )}

      {/* Lista de Objetivos de Campaña Registrados */}
      {objectives.length === 0 ? (
        <div className="p-8 bg-space-950 border border-space-800 rounded-2xl text-center text-xs text-slate-500">
          No hay objetivos de campaña registrados actualmente.
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map(obj => {
            const isObj1 = obj.objectiveNumber === 1;

            return (
              <div
                key={obj.id}
                className="bg-space-900 border border-space-700 rounded-2xl p-5 shadow-xl space-y-4"
              >
                {/* Cabecera del Objetivo */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-space-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-space-800 border border-space-600 font-mono font-bold text-xs text-space-accent">
                          Objetivo #{obj.objectiveNumber}
                        </span>
                        <h3 className="text-base font-bold text-slate-100">{obj.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{obj.description}</p>
                    </div>
                  </div>

                  {/* Badge de Resultado */}
                  <div className="flex items-center gap-2">
                    {obj.status === 'en_curso' && (
                      <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>En curso</span>
                      </span>
                    )}
                    {obj.status === 'exito' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>✓ Éxito Cumplido</span>
                      </span>
                    )}
                    {obj.status === 'fracaso' && (
                      <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>✗ Fracaso</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Campos Oficiales: Mundo Aceptado, Lugar Ejecución, Fecha Máxima */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-space-accent" />
                      <span>Mundo donde se aceptó</span>
                    </span>
                    <strong className="text-slate-200">
                      {obj.acceptedPlanetName} (#{obj.acceptedPlanetCode})
                    </strong>
                  </div>

                  <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Lugar de ejecución</span>
                    </span>
                    <strong className="text-slate-200">{obj.executionLocation}</strong>
                  </div>

                  <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Fecha máxima</span>
                    </span>
                    <strong className="text-slate-200">{obj.maxDate}</strong>
                  </div>
                </div>

                {/* Desglose de Progreso en Tiempo Real para el Objetivo nº 1 */}
                {isObj1 && (
                  <div className="p-4 bg-space-950 border border-space-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">
                        Requisitos de Contratación ({obj1Progress.fulfilledCount} / {obj1Progress.totalRequired} puestos cubiertos):
                      </span>
                      {obj1Progress.isComplete ? (
                        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>¡Plantilla completa! Listo para marcar éxito</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold text-xs">
                          {obj1Progress.totalRequired - obj1Progress.fulfilledCount} puestos pendientes
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {obj1Progress.positionsStatus.map(p => (
                        <div
                          key={p.position}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            p.fulfilled
                              ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                              : 'bg-space-900 border-space-800 text-slate-400'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-[11px]">{p.position}</div>
                            <div className="text-[10px] opacity-80 mt-0.5">
                              {p.fulfilled ? p.employeeName : 'Pendiente de contratar'}
                            </div>
                          </div>

                          {p.fulfilled ? (
                            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <UserX className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones de Control de Resultado */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-space-800/80 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Informa manualmente del resultado según avances en el Libro de Campaña:
                  </span>

                  <div className="flex items-center gap-2">
                    {obj.status !== 'exito' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(obj.id, 'exito')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marcar Éxito</span>
                      </button>
                    )}

                    {obj.status !== 'fracaso' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(obj.id, 'fracaso')}
                        className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Marcar Fracaso</span>
                      </button>
                    )}

                    {obj.status !== 'en_curso' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(obj.id, 'en_curso')}
                        className="px-3 py-1.5 border border-space-700 text-slate-300 hover:bg-space-800 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
