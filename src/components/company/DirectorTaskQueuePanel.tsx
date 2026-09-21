import { GameSave } from '../../types/game';
import { cancelHiringTask } from '../../engine/hiring';
import { 
  ShieldCheck, 
  Clock, 
  Trash2, 
  Plus, 
  Calendar, 
  AlertCircle
} from 'lucide-react';

interface DirectorTaskQueuePanelProps {
  game: GameSave;
  onUpdateGame: (updated: GameSave) => void;
  onOpenHiringModal: () => void;
}

export function DirectorTaskQueuePanel({
  game,
  onUpdateGame,
  onOpenHiringModal
}: DirectorTaskQueuePanelProps) {
  const director = game.company.employees.find(
    e => e.isActive && e.position.toLowerCase().includes('director gerente')
  );

  const tasks = game.directorTasks || [];
  const activeTask = tasks.find(t => t.status === 'activa');
  const queuedTasks = tasks.filter(t => t.status === 'encolada');

  const handleCancelTask = (taskId: string, positionKey: string) => {
    if (confirm(`¿Cancelar el encargo de búsqueda para ${positionKey}?`)) {
      const updatedGame = cancelHiringTask(game, taskId);
      onUpdateGame(updatedGame);
    }
  };

  return (
    <div className="bg-space-800 border border-space-700 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-space-700">
        <div>
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Agenda de Encargos del Director Gerente</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Planificación secuencial de búsquedas y contrataciones (ejecución una a una)
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenHiringModal}
          disabled={!director}
          className="px-3.5 py-2 bg-space-accent hover:bg-sky-400 text-space-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{tasks.length > 0 ? 'Encolar Nuevo Encargo' : 'Iniciar Encargo'}</span>
        </button>
      </div>

      {/* Si no hay Director */}
      {!director && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>No hay Director Gerente en plantilla. Contrata uno para gestionar búsquedas.</span>
        </div>
      )}

      {/* Lista de Tareas */}
      {tasks.length === 0 ? (
        <div className="p-6 bg-space-950 border border-space-800 rounded-xl text-center text-xs text-slate-500">
          La agenda del Director Gerente está libre. Puedes iniciar o encolar búsquedas de personal.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tarea Activa */}
          {activeTask && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/50 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-bold text-[10px] uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400 animate-spin" />
                  <span>En Curso Actualmente</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Resolución: Día {activeTask.targetDate.day} / Mes {activeTask.targetDate.month}</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-slate-100 text-sm">{activeTask.positionKey}</strong>
                  <span className="text-slate-400 ml-2 capitalize">({activeTask.experience})</span>
                  <div className="text-[11px] text-space-accent mt-0.5">
                    Candidato: {activeTask.candidateName} · Salario: {activeTask.monthlySalary} SC/mes · Umbral: {activeTask.hireThreshold}+
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-300 bg-space-900 px-2.5 py-1 rounded border border-space-700">
                  {activeTask.searchDays} {activeTask.searchDays === 1 ? 'día' : 'días'}
                </span>
              </div>
            </div>
          )}

          {/* Tareas Encoladas */}
          {queuedTasks.map((task, idx) => (
            <div
              key={task.id}
              className="p-3 bg-space-950 border border-space-800 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-space-900 border border-space-700 text-slate-400 font-mono text-[11px] flex items-center justify-center font-bold">
                  {idx + 2}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-200">{task.positionKey}</strong>
                    <span className="text-slate-400 capitalize">({task.experience})</span>
                    <span className="px-1.5 py-0.2 rounded bg-space-900 text-slate-400 text-[10px] border border-space-700">
                      En cola
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Candidato: {task.candidateName} · Previsto: Día {task.targetDate.day} / Mes {task.targetDate.month} (+{task.searchDays}d)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCancelTask(task.id, task.positionKey)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-space-900 rounded-lg transition-colors"
                title="Cancelar este encargo encolado"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
