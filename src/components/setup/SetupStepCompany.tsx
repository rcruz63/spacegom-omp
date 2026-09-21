import { Building2, Sparkles } from 'lucide-react';

interface SetupStepCompanyProps {
  saveName: string;
  setSaveName: (val: string) => void;
  companyName: string;
  setCompanyName: (val: string) => void;
  shipName: string;
  setShipName: (val: string) => void;
  difficulty: 'facil' | 'normal' | 'dificil';
  setDifficulty: (val: 'facil' | 'normal' | 'dificil') => void;
  onShuffleCompanyName: () => void;
  onShuffleShipName: () => void;
}

export function SetupStepCompany({
  saveName,
  setSaveName,
  companyName,
  setCompanyName,
  shipName,
  setShipName,
  difficulty,
  setDifficulty,
  onShuffleCompanyName,
  onShuffleShipName
}: SetupStepCompanyProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-space-accent" />
          Identificación de Compañía y Astronave
        </h3>
        <p className="text-xs text-slate-400">
          Elige los nombres o genera sugerencias de las bases de datos de megacorporaciones y naves.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
            Nombre de la Campaña / Partida
          </label>
          <input
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-space-accent"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs uppercase font-semibold text-slate-300">
              Nombre de la Compañía
            </label>
            <button
              type="button"
              onClick={onShuffleCompanyName}
              className="text-xs text-space-accent hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sugerir Megacorp</span>
            </button>
          </div>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-space-accent"
            required
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs uppercase font-semibold text-slate-300">
              Nombre de la Nave Inicial (Transporte Ligero Clase A)
            </label>
            <button
              type="button"
              onClick={onShuffleShipName}
              className="text-xs text-space-accent hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sugerir Nave</span>
            </button>
          </div>
          <input
            type="text"
            value={shipName}
            onChange={e => setShipName(e.target.value)}
            className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-space-accent"
            required
          />
        </div>
      </div>

      {/* Nivel de Dificultad */}
      <div className="pt-4 border-t border-space-800">
        <label className="block text-xs uppercase font-semibold text-slate-300 mb-3">
          Nivel de Dificultad (Saldo Inicial en Tesorería)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'facil' as const, name: 'Fácil', sc: 600, desc: '600 SC iniciales. Margen holgado para contingencias.' },
            { id: 'normal' as const, name: 'Normal', sc: 500, desc: '500 SC iniciales. Ajustado a la normativa estándar.' },
            { id: 'dificil' as const, name: 'Difícil', sc: 400, desc: '400 SC iniciales. Gestión de costes estricta y riesgo alto.' }
          ].map(lvl => {
            const isSelected = difficulty === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setDifficulty(lvl.id)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-space-800 border-space-accent shadow-lg shadow-space-accent/10 ring-1 ring-space-accent'
                    : 'bg-space-950/60 border-space-800 hover:border-space-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold text-sm ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                    {lvl.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-black ${
                    isSelected ? 'bg-space-accent text-space-950' : 'bg-space-800 text-slate-300'
                  }`}>
                    {lvl.sc} SC
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{lvl.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
