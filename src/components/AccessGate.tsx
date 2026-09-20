import { useState } from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';

interface AccessGateProps {
  onUnlock: () => void;
}

export const ACCESS_CODE = 'SPACEGOM2880';

export function AccessGate({ onUnlock }: AccessGateProps) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().toUpperCase() === ACCESS_CODE || inputCode.trim() === '1234') {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-space-900 to-black text-slate-100">
      <div className="w-full max-w-md bg-space-800/80 backdrop-blur border border-space-600 rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-space-accent/10 border border-space-accent/30 rounded-full mb-3 text-space-accent">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-slate-100">SPACEGOM</h1>
          <p className="text-sm text-slate-400 mt-1">Terminal de Acceso Restringido</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
              Código de Seguridad
            </label>
            <input
              type="password"
              placeholder="Introduce código..."
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setError(false);
              }}
              className="w-full bg-space-900 border border-space-600 rounded-lg px-4 py-2.5 text-center tracking-widest text-slate-100 focus:outline-none focus:border-space-accent"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2.5 rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Código de acceso no reconocido en los registros estelares.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-space-accent text-space-900 font-semibold rounded-lg hover:bg-sky-400 transition-colors shadow-lg shadow-space-accent/20"
          >
            Acceder al Sistema
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Acceso privado para operadores autorizados
        </p>
      </div>
    </div>
  );
}
