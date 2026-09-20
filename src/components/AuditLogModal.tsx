import { useState } from 'react';
import { AuditLogEntry } from '../types/common';
import { formatDate } from '../engine/calendar';
import { exportLogToText } from '../engine/auditLog';
import { FileText, Download, Filter, Search, X } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: AuditLogEntry[];
}

export function AuditLogModal({ isOpen, onClose, entries }: AuditLogModalProps) {
  const [filterCat, setFilterCat] = useState<string>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = entries.filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    if (search.trim() && !e.action.toLowerCase().includes(search.toLowerCase()) && !e.details.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleExport = () => {
    const text = exportLogToText(entries);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spacegom_bitacora_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-space-800 border border-space-600 rounded-2xl p-6 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-space-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-lg text-space-accent">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Bitácora de Auditoría y Registro</h2>
              <p className="text-xs text-slate-400">Historial completo para trasladar al papel de ser necesario</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-space-700 hover:bg-space-600 text-space-accent text-xs font-semibold rounded-lg border border-space-600"
              title="Descargar registro como fichero de texto"
            >
              <Download className="w-4 h-4" />
              <span>Exportar TXT</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en el registro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-space-900 border border-space-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-space-accent"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="bg-space-900 border border-space-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">Todas las categorías</option>
              <option value="sistema">Sistema</option>
              <option value="dados">Dados</option>
              <option value="calendario">Calendario</option>
              <option value="tesoreria">Tesorería</option>
              <option value="nave">Nave</option>
              <option value="tripulacion">Tripulación</option>
              <option value="comercio">Comercio</option>
              <option value="misiones">Misiones</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500">No hay entradas coincidentes en el registro.</p>
          ) : (
            filtered.map(entry => (
              <div
                key={entry.id}
                className="p-3 bg-space-900/80 border border-space-700/80 rounded-lg text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-space-accent font-semibold">
                    {formatDate(entry.gameDate)}
                  </span>
                  <span className="uppercase text-[9px] px-1.5 py-0.5 bg-space-700 text-slate-300 rounded font-semibold tracking-wider">
                    {entry.category}
                  </span>
                </div>
                <div className="font-bold text-slate-200">{entry.action}</div>
                <div className="text-slate-400">{entry.details}</div>
                {entry.rollDetails && (
                  <div className="text-[11px] font-mono text-amber-300 mt-1 bg-space-800 p-1.5 rounded border border-space-700">
                    🎲 Dados: [{entry.rollDetails.rolls.join(', ')}] Suma={entry.rollDetails.sum} Total={entry.rollDetails.total}
                    {entry.rollDetails.isManual ? ' (Manual)' : ' (Auto)'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
