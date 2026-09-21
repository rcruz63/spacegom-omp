import React, { useState, useMemo } from 'react';
import { GameSave } from '../types/game';
import { PlanetData } from '../types/universe';
import { ExperienceLevel } from '../types/common';
import { 
  POSITIONS_CATALOG, 
  getAvailablePositionsForPlanet, 
  startHiringSearch 
} from '../engine/hiring';
import { PERSONNEL_NAMES, getRandomItem, getUniqueRandomItems } from '../data/names';
import { DiceRollerVisual } from './common/DiceRollerVisual';
import { 
  UserPlus, 
  Sparkles, 
  Clock, 
  Coins, 
  Target, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Building2
} from 'lucide-react';

interface HiringModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  currentPlanet: PlanetData | null;
  onUpdateGame: (updated: GameSave) => void;
}

export function HiringModal({
  isOpen,
  onClose,
  game,
  currentPlanet,
  onUpdateGame
}: HiringModalProps) {
  const director = useMemo(() => {
    return game.company.employees.find(e => e.isActive && e.position.toLowerCase().includes('director gerente'));
  }, [game.company.employees]);

  const availablePositions = useMemo(() => {
    return getAvailablePositionsForPlanet(currentPlanet);
  }, [currentPlanet]);

  const [selectedPositionKey, setSelectedPositionKey] = useState<string>(() => {
    return availablePositions[0]?.title || 'Abogado';
  });

  const [experience, setExperience] = useState<ExperienceLevel>('estandar');
  const [candidateName, setCandidateName] = useState<string>(() => {
    const usedNames = game.company.employees.map(e => e.name);
    return getUniqueRandomItems(PERSONNEL_NAMES, 1, usedNames)[0] || 'Candidato Desconocido';
  });

  const selectedPosition = POSITIONS_CATALOG[selectedPositionKey] || availablePositions[0];
  const isFixedDays = selectedPosition?.searchTimeDice === '1' || selectedPosition?.searchTimeDice === '2';

  const diceCountForPosition = useMemo(() => {
    if (!selectedPosition) return 1;
    if (selectedPosition.searchTimeDice === '1d6') return 1;
    if (selectedPosition.searchTimeDice === '2d6') return 2;
    if (selectedPosition.searchTimeDice === '3d6') return 3;
    return 1;
  }, [selectedPosition]);

  // Estado de dados para la duración de búsqueda
  const [searchDiceValues, setSearchDiceValues] = useState<number[] | null>(() => {
    if (isFixedDays) {
      return [Number(selectedPosition.searchTimeDice)];
    }
    return null;
  });
  const [isSearchDiceRolled, setIsSearchDiceRolled] = useState<boolean>(() => isFixedDays);

  const handlePositionChange = (posKey: string) => {
    setSelectedPositionKey(posKey);
    const newPos = POSITIONS_CATALOG[posKey];
    if (newPos?.searchTimeDice === '1' || newPos?.searchTimeDice === '2') {
      setSearchDiceValues([Number(newPos.searchTimeDice)]);
      setIsSearchDiceRolled(true);
    } else {
      setSearchDiceValues(null);
      setIsSearchDiceRolled(false);
    }
  };

  const rawDiceSum = useMemo(() => {
    if (!searchDiceValues) return null;
    return searchDiceValues.reduce((a, b) => a + b, 0);
  }, [searchDiceValues]);

  const calculatedDays = useMemo(() => {
    if (rawDiceSum === null) return null;
    if (experience === 'novato') return Math.max(1, Math.ceil(rawDiceSum / 2));
    if (experience === 'veterano') return rawDiceSum * 2;
    return rawDiceSum;
  }, [rawDiceSum, experience]);

  const calculatedSalary = useMemo(() => {
    if (!selectedPosition) return 0;
    if (experience === 'novato') return Math.max(1, Math.ceil(selectedPosition.baseSalary / 2));
    if (experience === 'veterano') return selectedPosition.baseSalary * 2;
    return selectedPosition.baseSalary;
  }, [selectedPosition, experience]);

  const handleShuffleName = () => {
    const usedNames = game.company.employees.map(e => e.name);
    const sug = getUniqueRandomItems(PERSONNEL_NAMES, 1, usedNames)[0] || getRandomItem(PERSONNEL_NAMES);
    setCandidateName(sug);
  };

  const handleStartSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!director) {
      alert('Se requiere un Director Gerente en la tripulación para realizar la búsqueda.');
      return;
    }

    if (director.isBusy) {
      alert(`El Director Gerente está ocupado: ${director.busyReason}.`);
      return;
    }

    if (rawDiceSum === null) {
      alert('Debes lanzar o introducir los dados de tiempo de búsqueda.');
      return;
    }

    try {
      const res = startHiringSearch(
        game,
        selectedPosition.title,
        experience,
        candidateName,
        rawDiceSum
      );

      onUpdateGame(res.nextGame);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al iniciar búsqueda';
      alert(message);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-space-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Búsqueda y Selección de Personal
              </h3>
              <p className="text-xs text-slate-400">
                Encargo oficial al Director Gerente según normativa Spacegom
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-space-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Status del Director Gerente */}
          {director ? (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              director.isBusy 
                ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' 
                : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">
                    Director Gerente: {director.name}
                  </span>
                  <span className="text-[11px] opacity-80">
                    Moral: <strong className="capitalize">{director.morale}</strong> · Experiencia: <strong className="capitalize">{director.experience}</strong>
                  </span>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                director.isBusy ? 'bg-amber-900/60 text-amber-200' : 'bg-emerald-900/60 text-emerald-200'
              }`}>
                {director.isBusy ? 'Ocupado' : 'Disponible'}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No hay Director Gerente en plantilla. No es posible iniciar contrataciones.</span>
            </div>
          )}

          {/* Información Tecnológica del Planeta */}
          <div className="p-3 bg-space-950 border border-space-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-space-accent" />
              <span className="text-slate-300">
                Mundo actual: <strong className="text-slate-100">{currentPlanet?.name || 'Desconocido'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Nivel: <strong className="text-slate-200">{currentPlanet?.tech_level || 'Estándar'}</strong></span>
              <span>Población: <strong className="text-slate-200">{currentPlanet?.population_over_1000 ? '> 1.000 hab' : '≤ 1.000'}</strong></span>
            </div>
          </div>

          {availablePositions.length === 0 ? (
            <div className="p-4 bg-space-950 border border-space-800 rounded-xl text-center text-xs text-slate-400">
              <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p>Este mundo no reúne los requisitos tecnológicos o poblacionales mínimos para contratar personal.</p>
            </div>
          ) : (
            <form onSubmit={handleStartSearch} className="space-y-4 text-xs">
              
              {/* Selector de Puesto */}
              <div>
                <label className="block uppercase font-bold text-slate-300 mb-1.5">
                  Puesto o Cargo a Buscar ({availablePositions.length} disponibles en este mundo)
                </label>
                <select
                  value={selectedPositionKey}
                  onChange={e => handlePositionChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-space-accent"
                >
                  {availablePositions.map(pos => (
                    <option key={pos.title} value={pos.title}>
                      {pos.title} — Base: {pos.baseSalary} SC/mes · Tiempo: {pos.searchTimeDice} · Umbral: {pos.hireThreshold}+
                    </option>
                  ))}
                </select>
                {selectedPosition && (
                  <p className="text-[11px] text-slate-400 mt-1.5 italic">
                    {selectedPosition.description}
                  </p>
                )}
              </div>

              {/* Experiencia Deseada */}
              <div>
                <label className="block uppercase font-bold text-slate-300 mb-1.5">
                  Nivel de Experiencia del Candidato
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'novato', label: 'Novato', desc: 'Mitad de tiempo y salario. -1 en tiradas.' },
                    { id: 'estandar', label: 'Estándar', desc: 'Tiempo y salario normales. +0 en tiradas.' },
                    { id: 'veterano', label: 'Veterano', desc: 'Doble de tiempo y salario. +1 en tiradas.' }
                  ].map(lvl => {
                    const isSelected = experience === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setExperience(lvl.id as ExperienceLevel)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-space-800 border-space-accent ring-1 ring-space-accent'
                            : 'bg-space-950/60 border-space-800 hover:border-space-700 text-slate-400'
                        }`}
                      >
                        <span className={`font-bold block text-xs ${isSelected ? 'text-space-accent' : 'text-slate-300'}`}>
                          {lvl.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                          {lvl.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tirador de Tiempo de Búsqueda (Automático o Manual) */}
              {isFixedDays ? (
                <div className="p-3 bg-space-950 border border-space-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>Tiempo fijado por reglamento para {selectedPosition.title}:</span>
                  </div>
                  <strong className="text-slate-100 font-bold">
                    {calculatedDays} {calculatedDays === 1 ? 'día' : 'días'}
                  </strong>
                </div>
              ) : (
                <DiceRollerVisual
                  diceCount={diceCountForPosition}
                  values={searchDiceValues}
                  isRolled={isSearchDiceRolled}
                  title={`Tirada de Días de Búsqueda (${selectedPosition.searchTimeDice})`}
                  subtitle={`Determina los días necesarios para localizar al candidato (${experience})`}
                  resultLabel="Días Calculados"
                  resultValue={calculatedDays !== null ? `${calculatedDays} ${calculatedDays === 1 ? 'día' : 'días'}` : undefined}
                  onRollComplete={vals => {
                    setSearchDiceValues(vals);
                    setIsSearchDiceRolled(true);
                  }}
                  onManualChange={vals => {
                    setSearchDiceValues(vals);
                    setIsSearchDiceRolled(true);
                  }}
                />
              )}

              {/* Nombre del Candidato */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block uppercase font-bold text-slate-300">
                    Nombre del Candidato
                  </label>
                  <button
                    type="button"
                    onClick={handleShuffleName}
                    className="text-[11px] text-space-accent hover:text-sky-300 flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sugerir Nombre</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-space-accent"
                  required
                />
              </div>

              {/* Resumen de Parámetros de la Búsqueda */}
              <div className="p-4 bg-space-950 border border-space-800 rounded-xl grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-space-900/60 rounded-lg border border-space-800/80">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[11px] uppercase font-semibold">Duración</span>
                  </div>
                  <span className={`text-base font-black ${calculatedDays !== null ? 'text-slate-100' : 'text-slate-500'}`}>
                    {calculatedDays !== null ? `${calculatedDays} ${calculatedDays === 1 ? 'día' : 'días'}` : 'Pendiente'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    (Fórmula: {selectedPosition.searchTimeDice})
                  </span>
                </div>

                <div className="p-2.5 bg-space-900/60 rounded-lg border border-space-800/80">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] uppercase font-semibold">Salario</span>
                  </div>
                  <span className="text-base font-black text-amber-300">
                    {calculatedSalary} SC
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    mensuales
                  </span>
                </div>

                <div className="p-2.5 bg-space-900/60 rounded-lg border border-space-800/80">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] uppercase font-semibold">Dificultad</span>
                  </div>
                  <span className="text-base font-black text-rose-300">
                    {selectedPosition.hireThreshold}+
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    en 2D6 + mods
                  </span>
                </div>
              </div>
              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-3 border-t border-space-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-space-700 text-slate-300 rounded-lg hover:bg-space-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!director || director.isBusy || !isSearchDiceRolled}
                  className="flex items-center gap-2 px-5 py-2 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-space-accent/10"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Iniciar Búsqueda de Personal</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
