import { useState } from 'react';
import { GameSummary, GameSave } from '../types/game';
import { formatDate } from '../engine/calendar';
import { createNewGame, deleteGame, loadAllSaves } from '../engine/storage';
import { Rocket, Plus, Trash2, Play, Calendar, Users, Globe, Coins, Award } from 'lucide-react';

interface SavesManagerProps {
  onSelectGame: (game: GameSave) => void;
}

export function SavesManager({ onSelectGame }: SavesManagerProps) {
  const [saves, setSaves] = useState<GameSummary[]>(() => {
    return loadAllSaves().map(g => ({
      id: g.id,
      name: g.name,
      companyName: g.company.name,
      reputation: g.company.reputation,
      treasury: g.company.treasury,
      date: g.date,
      exploredPlanetsCount: g.universe.usedPlanetCodes.length,
      exploredSectorsCount: Object.keys(g.universe.areas).length,
      employeesCount: g.company.employees.filter(e => e.isActive).length,
      updatedAt: g.updatedAt
    }));
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('Starblack');
  const [newSaveName, setNewSaveName] = useState('Mi Campaña Spacegom');

  const refreshSaves = () => {
    const all = loadAllSaves();
    setSaves(all.map(g => ({
      id: g.id,
      name: g.name,
      companyName: g.company.name,
      reputation: g.company.reputation,
      treasury: g.company.treasury,
      date: g.date,
      exploredPlanetsCount: g.universe.usedPlanetCodes.length,
      exploredSectorsCount: Object.keys(g.universe.areas).length,
      employeesCount: g.company.employees.filter(e => e.isActive).length,
      updatedAt: g.updatedAt
    })));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const game = createNewGame(newCompanyName.trim() || 'Starblack', newSaveName.trim());
    setIsCreating(false);
    refreshSaves();
    onSelectGame(game);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar definitivamente la partida "${name}"?`)) {
      deleteGame(id);
      refreshSaves();
    }
  };

  const handleLoad = (id: string) => {
    const all = loadAllSaves();
    const game = all.find(g => g.id === id);
    if (game) onSelectGame(game);
  };

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto flex flex-col justify-center">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-space-700">
        <div>
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-space-accent" />
            <h1 className="text-3xl font-black tracking-wider text-slate-100">SPACEGOM</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Gestión y Registro de Campañas Interestelares</p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-space-accent text-space-900 font-bold rounded-lg hover:bg-sky-400 transition-colors shadow-lg shadow-space-accent/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Partida</span>
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 p-6 bg-space-800 border border-space-600 rounded-xl shadow-xl">
          <h2 className="text-lg font-bold text-slate-100 mb-4">Iniciar Nueva Campaña</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Nombre de la Partida
              </label>
              <input
                type="text"
                value={newSaveName}
                onChange={e => setNewSaveName(e.target.value)}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-space-accent"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Nombre de la Compañía
              </label>
              <input
                type="text"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-space-accent"
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-space-600 text-slate-300 rounded-lg hover:bg-space-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-space-accent text-space-900 font-bold rounded-lg hover:bg-sky-400"
              >
                Comenzar Campaña
              </button>
            </div>
          </form>
        </div>
      )}

      {saves.length === 0 ? (
        <div className="text-center py-16 bg-space-800/40 border border-space-700/60 rounded-xl">
          <Rocket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No hay partidas guardadas</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Crea una nueva partida para comenzar tu andadura al mando de tu propia compañía espacial.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {saves.map(save => (
            <div
              key={save.id}
              className="p-5 bg-space-800/90 border border-space-700 rounded-xl hover:border-space-500 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{save.name}</h3>
                    <p className="text-sm text-space-accent font-medium">{save.companyName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(save.id, save.name)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Eliminar partida"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 pt-3 border-t border-space-700/60 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(save.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-amber-300">{save.treasury} SC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>{save.exploredPlanetsCount} planetas ({save.exploredSectorsCount} áreas)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{save.employeesCount} trabajadores</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Reputación: {save.reputation}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleLoad(save.id)}
                className="mt-5 w-full flex items-center justify-center gap-2 py-2 px-4 bg-space-700 hover:bg-space-600 text-space-accent font-semibold rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Reanudar Campaña</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
