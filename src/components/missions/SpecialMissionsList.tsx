import { useState } from 'react';
import { SpecialMission } from '../../types/missions';
import { 
  ScrollText, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Coins, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Target,
  RotateCcw,
  Clock,
  X
} from 'lucide-react';

interface SpecialMissionsListProps {
  missions: SpecialMission[];
  currentPlanetName: string;
  currentPlanetCode: number;
  onAddMission: (mission: Omit<SpecialMission, 'id' | 'category'>) => void;
  onResolveMission: (id: string, success: boolean) => void;
  onReopenMission: (id: string) => void;
}

export function SpecialMissionsList({
  missions,
  currentPlanetName,
  currentPlanetCode,
  onAddMission,
  onResolveMission,
  onReopenMission
}: SpecialMissionsListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [bookPage, setBookPage] = useState<number>(40);
  const [title, setTitle] = useState('');
  const [executionLocation, setExecutionLocation] = useState('Mundo adyacente');
  const [maxDate, setMaxDate] = useState('Día 35 / Mes 2');
  const [rewardSC, setRewardSC] = useState<number>(50);
  const [notes, setNotes] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMission({
      code: code.trim() || `MIS-${missions.length + 1}`,
      bookPage: Number(bookPage),
      title: title.trim() || 'Misión Especial Secundaria',
      acceptedPlanetCode: currentPlanetCode,
      acceptedPlanetName: currentPlanetName,
      executionLocation: executionLocation.trim(),
      maxDate: maxDate.trim(),
      rewardSC: Number(rewardSC),
      status: 'en_curso',
      notes: notes.trim()
    });

    setIsAdding(false);
    setCode('');
    setTitle('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Botón de Alta y Título */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-space-accent" />
            <span>Misiones Especiales Secundarias</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Encargos obtenidos en planetas con misiones disponibles (columna *10)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-2 bg-space-accent hover:bg-sky-400 text-space-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'Cancelar Alta' : 'Registrar Misión Especial'}</span>
        </button>
      </div>

      {/* Formulario de Alta de Misión Especial */}
      {isAdding && (
        <div className="p-5 bg-space-900 border border-space-700 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <h4 className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-space-accent" />
              <span>Registrar Nueva Misión Especial en {currentPlanetName}</span>
            </h4>
          </div>

          <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                Código de Misión
              </label>
              <input
                type="text"
                placeholder="Ej. MIS-01, EXP-12..."
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:border-space-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                Página del Libro
              </label>
              <input
                type="number"
                min={1}
                value={bookPage}
                onChange={e => setBookPage(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:border-space-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                Recompensa (SC)
              </label>
              <input
                type="number"
                min={0}
                value={rewardSC}
                onChange={e => setRewardSC(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:border-space-accent focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                Título o Resumen del Encargo
              </label>
              <input
                type="text"
                placeholder="Ej. Transporte de científico a estación orbital..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:border-space-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                Lugar de Ejecución
              </label>
              <input
                type="text"
                value={executionLocation}
                onChange={e => setExecutionLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:border-space-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                Fecha Máxima
              </label>
              <input
                type="text"
                value={maxDate}
                onChange={e => setMaxDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:border-space-accent focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                Notas adicionales (opcional)
              </label>
              <input
                type="text"
                placeholder="Requisitos especiales de personal, mercancías..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:border-space-accent focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-1.5 border border-space-700 text-slate-300 rounded-lg hover:bg-space-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400"
              >
                Guardar Misión Especial
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Misiones */}
      {missions.length === 0 ? (
        <div className="p-8 bg-space-950 border border-space-800 rounded-2xl text-center text-xs text-slate-500">
          No hay misiones especiales secundarias registradas.
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map(m => (
            <div
              key={m.id}
              className="bg-space-900 border border-space-700 rounded-2xl p-5 shadow-xl space-y-3"
            >
              {/* Cabecera de la Misión */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-space-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-space-800 border border-space-600 font-mono font-bold text-xs text-space-accent">
                      {m.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-100">{m.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Página {m.bookPage} del Libro</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-amber-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>+{m.rewardSC} SC Recompensa</span>
                    </span>
                  </div>
                </div>

                {/* Badge de Estado */}
                <div className="flex items-center gap-2">
                  {m.status === 'en_curso' && (
                    <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>En curso</span>
                    </span>
                  )}
                  {m.status === 'exito' && (
                    <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Éxito Completada</span>
                    </span>
                  )}
                  {m.status === 'fracaso' && (
                    <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>✗ Fracasada</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Campos Oficiales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-space-accent" />
                    <span>Mundo aceptado</span>
                  </span>
                  <strong className="text-slate-200">
                    {m.acceptedPlanetName} (#{m.acceptedPlanetCode})
                  </strong>
                </div>

                <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Lugar ejecución</span>
                  </span>
                  <strong className="text-slate-200">{m.executionLocation}</strong>
                </div>

                <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fecha máxima</span>
                  </span>
                  <strong className="text-slate-200">{m.maxDate}</strong>
                </div>
              </div>

              {/* Botones de Control de Resultado */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-space-800/80 text-xs">
                <span className="text-[11px] text-slate-400">
                  {m.notes ? `Nota: ${m.notes}` : 'Informa del resultado al resolver el encargo:'}
                </span>

                <div className="flex items-center gap-2">
                  {m.status !== 'exito' && (
                    <button
                      type="button"
                      onClick={() => onResolveMission(m.id, true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completar (+{m.rewardSC} SC, +1 Rep)</span>
                    </button>
                  )}

                  {m.status !== 'fracaso' && (
                    <button
                      type="button"
                      onClick={() => onResolveMission(m.id, false)}
                      className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Fracasar (-1 Rep)</span>
                    </button>
                  )}

                  {m.status !== 'en_curso' && (
                    <button
                      type="button"
                      onClick={() => onReopenMission(m.id)}
                      className="px-3 py-1.5 border border-space-700 text-slate-300 hover:bg-space-800 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reabrir</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
