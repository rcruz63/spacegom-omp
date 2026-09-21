import React, { useState, useMemo } from 'react';
import { Rocket, ArrowRight, ArrowLeft } from 'lucide-react';
import { rollDice } from '../engine/dice';
import { 
  findConsecutiveStartingPlanet, 
  validateStartingPlanet, 
  PlanetValidationResult 
} from '../engine/universe';
import { INITIAL_CREW_ROSTER_TEMPLATE } from '../engine/company';
import { COMPANY_NAMES, SHIP_NAMES, PERSONNEL_NAMES, getRandomItem, getUniqueRandomItems } from '../data/names';
import { PlanetData } from '../types/universe';
import { NewGameOptions } from '../engine/storage';

import { SetupStepCompany } from './setup/SetupStepCompany';
import { SetupStepLocation } from './setup/SetupStepLocation';
import { SetupStepPlanet } from './setup/SetupStepPlanet';
import { SetupStepCrew } from './setup/SetupStepCrew';
import { PlanetEditModal } from './setup/PlanetEditModal';

interface SetupWizardProps {
  onComplete: (options: NewGameOptions) => void;
  onCancel: () => void;
}

type Step = 'empresa' | 'ubicacion' | 'planeta' | 'tripulacion';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('empresa');

  // --- PASO 1: Empresa, Nave, Dificultad ---
  const [saveName, setSaveName] = useState('Mi Campaña Spacegom');
  const [difficulty, setDifficulty] = useState<'facil' | 'normal' | 'dificil'>('normal');
  const [companyName, setCompanyName] = useState(() => getRandomItem(COMPANY_NAMES));
  const [shipName, setShipName] = useState(() => getRandomItem(SHIP_NAMES));

  // --- PASO 2: Área y Sector ---
  const [areaRoll, setAreaRoll] = useState<number>(() => rollDice({ diceCount: 2 }).sum);
  const [densityRoll, setDensityRoll] = useState<number>(() => rollDice({ diceCount: 2 }).sum);
  const [startCol, setStartCol] = useState<string>('C');
  const [startRow, setStartRow] = useState<number>(4);

  const density: 'Baja' | 'Media' | 'Alta' = useMemo(() => {
    if (densityRoll <= 4) return 'Baja';
    if (densityRoll <= 9) return 'Media';
    return 'Alta';
  }, [densityRoll]);

  // --- PASO 3: Planeta de Origen ---
  const [dice3D6, setDice3D6] = useState<[number, number, number]>(() => {
    const d1 = rollDice({ diceCount: 1 }).rolls[0];
    const d2 = rollDice({ diceCount: 1 }).rolls[0];
    const d3 = rollDice({ diceCount: 1 }).rolls[0];
    return [d1, d2, d3];
  });

  const rawRolledCode = dice3D6[0] * 100 + dice3D6[1] * 10 + dice3D6[2];
  const [customPlanets, setCustomPlanets] = useState<Record<number, PlanetData>>({});
  const [isEditingPlanet, setIsEditingPlanet] = useState(false);

  const consecutiveDetails = useMemo(() => {
    return findConsecutiveStartingPlanet(rawRolledCode, [], customPlanets);
  }, [rawRolledCode, customPlanets]);

  const activePlanet = consecutiveDetails.finalPlanet;
  const activeValidation: PlanetValidationResult = useMemo(() => {
    return validateStartingPlanet(activePlanet);
  }, [activePlanet]);

  const [planetForm, setPlanetForm] = useState<PlanetData>(activePlanet);

  // --- PASO 4: Tripulación Inicial ---
  const [crewNames, setCrewNames] = useState<string[]>(() => {
    return getUniqueRandomItems(PERSONNEL_NAMES, 11);
  });

  const totalCrewSalary = useMemo(() => {
    return INITIAL_CREW_ROSTER_TEMPLATE.reduce((sum, item) => sum + item.monthlySalary, 0);
  }, []);

  // Handlers para tiradas y shuffle
  const handleRollArea = () => setAreaRoll(rollDice({ diceCount: 2 }).sum);
  const handleRollDensity = () => setDensityRoll(rollDice({ diceCount: 2 }).sum);
  const handleRollQuadrant = () => {
    const cRoll = rollDice({ diceCount: 1 }).rolls[0];
    const rRoll = rollDice({ diceCount: 1 }).rolls[0];
    setStartCol(COLS[cRoll - 1]);
    setStartRow(rRoll);
  };
  const handleRollPlanet = () => {
    const d1 = rollDice({ diceCount: 1 }).rolls[0];
    const d2 = rollDice({ diceCount: 1 }).rolls[0];
    const d3 = rollDice({ diceCount: 1 }).rolls[0];
    setDice3D6([d1, d2, d3]);
  };

  const handleShuffleCompanyName = () => setCompanyName(getRandomItem(COMPANY_NAMES));
  const handleShuffleShipName = () => setShipName(getRandomItem(SHIP_NAMES));
  const handleShuffleCrewNames = () => setCrewNames(getUniqueRandomItems(PERSONNEL_NAMES, 11));

  const handleOpenEditPlanet = () => {
    setPlanetForm({ ...activePlanet });
    setIsEditingPlanet(true);
  };

  const handleSavePlanetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomPlanets(prev => ({
      ...prev,
      [planetForm.code]: { ...planetForm }
    }));
    setIsEditingPlanet(false);
  };

  const handleFinalize = () => {
    onComplete({
      saveName,
      companyName,
      shipName,
      difficulty,
      areaId: areaRoll,
      density,
      col: startCol,
      row: startRow,
      planetCode: activePlanet.code,
      customPlanets,
      crewNames
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-space-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Cabecera */}
        <div className="p-6 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-slate-100 uppercase">
                Setup de Partida Completo
              </h2>
              <p className="text-xs text-slate-400">
                Configuración reglamentaria de campaña interestelar Spacegom
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-space-800 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Barra de Pasos */}
        <div className="grid grid-cols-4 border-b border-space-800 bg-space-950/40 text-xs font-semibold">
          {[
            { id: 'empresa', label: '1. Identificación & Dificultad' },
            { id: 'ubicacion', label: '2. Área & Cuadrante' },
            { id: 'planeta', label: '3. Planeta de Origen' },
            { id: 'tripulacion', label: '4. Tripulación & Resumen' }
          ].map(s => {
            const isActive = currentStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id as Step)}
                className={`py-3 px-4 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                  isActive 
                    ? 'border-space-accent text-space-accent bg-space-800/60' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido del Paso */}
        <div className="p-6 flex-1 overflow-y-auto">
          {currentStep === 'empresa' && (
            <SetupStepCompany
              saveName={saveName}
              setSaveName={setSaveName}
              companyName={companyName}
              setCompanyName={setCompanyName}
              shipName={shipName}
              setShipName={setShipName}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              onShuffleCompanyName={handleShuffleCompanyName}
              onShuffleShipName={handleShuffleShipName}
            />
          )}

          {currentStep === 'ubicacion' && (
            <SetupStepLocation
              areaRoll={areaRoll}
              densityRoll={densityRoll}
              density={density}
              startCol={startCol}
              startRow={startRow}
              onRollArea={handleRollArea}
              onRollDensity={handleRollDensity}
              onRollQuadrant={handleRollQuadrant}
              onSelectQuadrant={(c, r) => {
                setStartCol(c);
                setStartRow(r);
              }}
            />
          )}

          {currentStep === 'planeta' && (
            <SetupStepPlanet
              dice3D6={dice3D6}
              rawRolledCode={rawRolledCode}
              activePlanet={activePlanet}
              activeValidation={activeValidation}
              consecutiveDetails={consecutiveDetails}
              onRollPlanet={handleRollPlanet}
              onOpenEditPlanet={handleOpenEditPlanet}
            />
          )}

          {currentStep === 'tripulacion' && (
            <SetupStepCrew
              crewNames={crewNames}
              totalCrewSalary={totalCrewSalary}
              companyName={companyName}
              shipName={shipName}
              difficulty={difficulty}
              areaRoll={areaRoll}
              startCol={startCol}
              startRow={startRow}
              density={density}
              activePlanet={activePlanet}
              onShuffleCrewNames={handleShuffleCrewNames}
            />
          )}
        </div>

        {/* Barra de Navegación Inferior */}
        <div className="p-4 bg-space-950 border-t border-space-800 flex items-center justify-between">
          <div>
            {currentStep !== 'empresa' && (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 'ubicacion') setCurrentStep('empresa');
                  if (currentStep === 'planeta') setCurrentStep('ubicacion');
                  if (currentStep === 'tripulacion') setCurrentStep('planeta');
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-space-700 text-slate-300 rounded-lg hover:bg-space-800 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep !== 'tripulacion' ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 'empresa') setCurrentStep('ubicacion');
                  if (currentStep === 'ubicacion') setCurrentStep('planeta');
                  if (currentStep === 'planeta') setCurrentStep('tripulacion');
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 text-xs transition-colors shadow"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalize}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Rocket className="w-4 h-4" />
                <span>Fundar Compañía e Iniciar Campaña</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para editar datos del planeta */}
      <PlanetEditModal
        isOpen={isEditingPlanet}
        planetForm={planetForm}
        setPlanetForm={setPlanetForm}
        onSave={handleSavePlanetEdit}
        onClose={() => setIsEditingPlanet(false)}
      />
    </div>
  );
}
