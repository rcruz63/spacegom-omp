import React from 'react';
import { PlanetData } from '../../types/universe';
import { Edit3 } from 'lucide-react';

interface PlanetEditModalProps {
  isOpen: boolean;
  planetForm: PlanetData;
  setPlanetForm: React.Dispatch<React.SetStateAction<PlanetData>>;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function PlanetEditModal({
  isOpen,
  planetForm,
  setPlanetForm,
  onSave,
  onClose
}: PlanetEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-space-900 border border-space-700 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-space-accent" />
          Actualizar Datos del Planeta #{planetForm.code} ({planetForm.name})
        </h4>
        <p className="text-xs text-slate-400">
          Permite corregir o completar atributos de requisitos de inicio en esta partida.
        </p>

        <form onSubmit={onSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nombre del Planeta</label>
            <input
              type="text"
              value={planetForm.name}
              onChange={e => setPlanetForm({ ...planetForm, name: e.target.value })}
              className="w-full bg-space-950 border border-space-700 rounded px-3 py-1.5 text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Población &gt; 1.000</label>
              <select
                value={planetForm.population_over_1000}
                onChange={e => setPlanetForm({ ...planetForm, population_over_1000: Number(e.target.value) })}
                className="w-full bg-space-950 border border-space-700 rounded px-2 py-1.5 text-slate-100"
              >
                <option value={1}>Sí (&gt; 1.000 hab)</option>
                <option value={0}>No (Incompatible)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Convenio Spacegom</label>
              <select
                value={planetForm.convenio_spacegom}
                onChange={e => setPlanetForm({ ...planetForm, convenio_spacegom: Number(e.target.value) })}
                className="w-full bg-space-950 border border-space-700 rounded px-2 py-1.5 text-slate-100"
              >
                <option value={1}>Sí (Adscrito)</option>
                <option value={0}>No (Sin convenio)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Soporte Vital</label>
              <input
                type="text"
                value={planetForm.life_support}
                onChange={e => setPlanetForm({ ...planetForm, life_support: e.target.value })}
                className="w-full bg-space-950 border border-space-700 rounded px-2 py-1.5 text-slate-100"
                placeholder="NO, MF, RF, SO..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nivel Tecnológico</label>
              <input
                type="text"
                value={planetForm.tech_level || ''}
                onChange={e => setPlanetForm({ ...planetForm, tech_level: e.target.value })}
                className="w-full bg-space-950 border border-space-700 rounded px-2 py-1.5 text-slate-100"
                placeholder="Estándar, Avanzado..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-space-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-space-700 text-slate-300 rounded hover:bg-space-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-space-accent text-space-950 font-bold rounded hover:bg-sky-400"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
