import { useState } from 'react';
import { GameSave } from '../../types/game';
import { SpecialMission } from '../../types/trade';
import { ScrollText, Plus, CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface MissionsViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function MissionsView({ game, onUpdateGame }: MissionsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState('Transporte Especial');
  const [rewardSC, setRewardSC] = useState(50);
  const [bookPage, setBookPage] = useState(60);
  const [notes, setNotes] = useState('');

  const activeMissions = game.missions.filter(m => m.status === 'activa');
  const finishedMissions = game.missions.filter(m => m.status !== 'activa');

  const handleCreateMission = (e: React.FormEvent) => {
    e.preventDefault();
    const mission: SpecialMission = {
      id: `mission_${Date.now()}`,
      code: code.trim() || `MIS-${game.missions.length + 1}`,
      type,
      originPlanetCode: game.universe.currentPlanetCode || 111,
      deadlineDays: 60,
      maxDate: `Día 28 Mes ${((game.date.month + 1) % 12) + 1}`,
      rewardSC,
      minReputation: 0,
      requiredPersonnel: 'Personal Estándar',
      bookPage,
      status: 'activa',
      notes: notes.trim()
    };

    const updatedLog = [
      {
        id: `log_mis_${Date.now()}`,
        gameDate: game.date,
        category: 'misiones' as const,
        action: 'Aceptada Misión Especial',
        details: `Misión ${mission.code} (${mission.type}) aceptada. Recompensa: ${rewardSC} SC. Detallada en pág. ${bookPage} del libro.`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      missions: [mission, ...game.missions],
      auditLog: updatedLog
    });

    setIsAdding(false);
    setCode('');
    setNotes('');
  };

  const handleResolveMission = (id: string, success: boolean) => {
    const target = game.missions.find(m => m.id === id);
    if (!target) return;

    let treasury = game.company.treasury;
    let reputation = game.company.reputation;

    if (success) {
      treasury += target.rewardSC;
      reputation += 1;
    } else {
      reputation = Math.max(0, reputation - 1);
    }

    const updatedMissions = game.missions.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: success ? ('completada' as const) : ('fallida' as const)
        };
      }
      return m;
    });

    const updatedLog = [
      {
        id: `log_mis_res_${Date.now()}`,
        gameDate: game.date,
        category: 'misiones' as const,
        action: success ? 'Misión Especial Superada' : 'Misión Especial Fracasada',
        details: success
          ? `Misión ${target.code} completada con éxito. Recompensa: +${target.rewardSC} SC, Reputación +1.`
          : `Misión ${target.code} fracasada. Reputación -1.`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      company: {
        ...game.company,
        treasury,
        reputation
      },
      missions: updatedMissions,
      auditLog: updatedLog
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Objectives overview */}
      <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-space-accent" />
            <span>Objetivos de Campaña y Misiones Especiales</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Lleva el seguimiento de los contratos, encargos y páginas del libro de Spacegom
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-space-accent text-space-900 font-bold text-xs rounded-lg hover:bg-sky-400 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Misión</span>
        </button>
      </div>

      {isAdding && (
        <div className="p-6 bg-space-800 border border-space-600 rounded-xl shadow-xl">
          <h3 className="text-md font-bold text-slate-100 mb-4">Registrar Nueva Misión Especial</h3>
          <form onSubmit={handleCreateMission} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Código de Misión
              </label>
              <input
                type="text"
                placeholder="Ej. MIS-41"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Tipo / Objetivo
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                <option value="Transporte Especial">Transporte Especial</option>
                <option value="Espionaje">Espionaje</option>
                <option value="Exploración">Exploración</option>
                <option value="Combate / Militar">Combate / Militar</option>
                <option value="Diplomacia">Diplomacia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Recompensa (SC)
              </label>
              <input
                type="number"
                min="0"
                value={rewardSC}
                onChange={e => setRewardSC(Number(e.target.value))}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Página del Libro
              </label>
              <input
                type="number"
                min="1"
                value={bookPage}
                onChange={e => setBookPage(Number(e.target.value))}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Notas / Condiciones
              </label>
              <input
                type="text"
                placeholder="Detalles sobre personal requerido, planeta destino, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-1.5 text-xs text-slate-400 border border-space-700 rounded-lg hover:bg-space-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-space-accent text-space-900 font-bold rounded-lg hover:bg-sky-400"
              >
                Aceptar Encargo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Missions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Misiones Activas ({activeMissions.length})
        </h3>

        {activeMissions.length === 0 ? (
          <div className="p-8 bg-space-800/40 border border-space-700/60 rounded-xl text-center text-xs text-slate-500">
            No tienes misiones activas en este momento. Acepta encargos en los planetas que visites.
          </div>
        ) : (
          activeMissions.map(m => (
            <div
              key={m.id}
              className="p-5 bg-space-800 border border-space-700 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-100">{m.code}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-space-700 text-space-accent rounded-full font-semibold">
                    {m.type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                    Pág. {m.bookPage}
                  </span>
                </div>
                {m.notes && <p className="text-xs text-slate-300">{m.notes}</p>}
                <div className="flex gap-4 text-xs text-slate-400 mt-2">
                  <span>Recompensa: <strong className="text-amber-300 font-mono">{m.rewardSC} SC</strong></span>
                  <span>Plazo máx: <strong className="text-slate-200 font-mono">{m.maxDate}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResolveMission(m.id, true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Completada</span>
                </button>
                <button
                  onClick={() => handleResolveMission(m.id, false)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Fracaso</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Finished Missions */}
      {finishedMissions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-space-700">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Historial de Misiones Resueltas ({finishedMissions.length})
          </h3>

          <div className="space-y-2">
            {finishedMissions.map(m => (
              <div
                key={m.id}
                className="p-3 bg-space-900/40 border border-space-700/60 rounded-lg flex justify-between items-center text-xs text-slate-400"
              >
                <div>
                  <span className="font-bold text-slate-300 mr-2">{m.code}</span>
                  <span>{m.type} (Pág. {m.bookPage})</span>
                </div>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                    m.status === 'completada' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  {m.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
