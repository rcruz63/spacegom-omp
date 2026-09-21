import React, { useState, useMemo } from 'react';
import { Rocket, ArrowRight, ArrowLeft } from 'lucide-react';
import { 
  findConsecutiveStartingPlanet, 
  validateStartingPlanet 
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

  // --- PASO 1: Empresa, Nave, Dificultad (fijos del tutorial por defecto) ---
  const [saveName, setSaveName] = useState('Mi Campaña Spacegom');
  const [difficulty, setDifficulty] = useState<'facil' | 'normal' | 'dificil'>('normal');
  const [companyName, setCompanyName] = useState('Starblack');
  const [shipName, setShipName] = useState('Astronave I');

  // --- PASO 2: Área y Sector (sin tirada previa al entrar) ---
  const [areaDice, setAreaDice] = useState<[number, number] | null>(null);
  const [densityDice, setDensityDice] = useState<[number, number] | null>(null);
  const [quadrantDice, setQuadrantDice] = useState<[number, number] | null>(null);

  const isAreaRolled = areaDice !== null;
  const isDensityRolled = densityDice !== null;
  const isQuadrantRolled = quadrantDice !== null;

  const areaRoll = areaDice ? areaDice[0] + areaDice[1] : null;
  const densityRoll = densityDice ? densityDice[0] + densityDice[1] : null;
  const density: 'Baja' | 'Media' | 'Alta' | null = useMemo(() => {
    if (densityRoll === null) return null;
    if (densityRoll <= 4) return 'Baja';
    if (densityRoll <= 9) return 'Media';
    return 'Alta';
  }, [densityRoll]);

  const startCol = quadrantDice ? COLS[quadrantDice[0] - 1] || 'A' : null;
  const startRow = quadrantDice ? quadrantDice[1] : null;

  // --- PASO 3: Planeta de Origen (sin tirada previa al entrar) ---
  const [dice3D6, setDice3D6] = useState<[number, number, number] | null>(null);
  const isPlanetRolled = dice3D6 !== null;
  const rawRolledCode = dice3D6 ? dice3D6[0] * 100 + dice3D6[1] * 10 + dice3D6[2] : null;

  const [customPlanets, setCustomPlanets] = useState<Record<number, PlanetData>>({});
  const [isEditingPlanet, setIsEditingPlanet] = useState(false);

  const consecutiveDetails = useMemo(() => {
    if (rawRolledCode === null) return null;
    return findConsecutiveStartingPlanet(rawRolledCode, [], customPlanets);
  }, [rawRolledCode, customPlanets]);

  const activePlanet = consecutiveDetails ? consecutiveDetails.finalPlanet : null;
  const activeValidation = useMemo(() => {
    if (!activePlanet) return null;
    return validateStartingPlanet(activePlanet);
  }, [activePlanet]);

  const [planetForm, setPlanetForm] = useState<PlanetData | null>(null);

  // --- PASO 4: Tripulación Inicial (fija oficial del tutorial) ---
  const [crewNames, setCrewNames] = useState<string[]>(() => {
    return INITIAL_CREW_ROSTER_TEMPLATE.map(t => t.defaultName);
  });

  const totalCrewSalary = useMemo(() => {
    return INITIAL_CREW_ROSTER_TEMPLATE.reduce((sum, item) => sum + item.monthlySalary, 0);
  }, []);

  // Handlers para shuffle
  const handleShuffleCompanyName = () => setCompanyName(getRandomItem(COMPANY_NAMES));
  const handleShuffleShipName = () => setShipName(getRandomItem(SHIP_NAMES));
  const handleShuffleCrewNames = () => setCrewNames(getUniqueRandomItems(PERSONNEL_NAMES, 11));

  const handleOpenEditPlanet = () => {
    if (activePlanet) {
      setPlanetForm({ ...activePlanet });
      setIsEditingPlanet(true);
    }
  };

  const handleSavePlanetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planetForm) {
      setCustomPlanets(prev => ({
        ...prev,
        [planetForm.code]: { ...planetForm }
      }));
      setIsEditingPlanet(false);
    }
  };

  const handleFinalize = () => {
    if (!areaRoll || !density || !startCol || !startRow || !activePlanet) return;

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

  // Validación de paso para botón Siguiente
  const canAdvanceCurrentStep = useMemo(() => {
    if (currentStep === 'empresa') {
      return saveName.trim().length > 0 && companyName.trim().length > 0 && shipName.trim().length > 0;
    }
    if (currentStep === 'ubicacion') {
      return isAreaRolled && isDensityRolled && isQuadrantRolled;
    }
    if (currentStep === 'planeta') {
      return isPlanetRolled && activePlanet !== null;
    }
    return true;
  }, [currentStep, saveName, companyName, shipName, isAreaRolled, isDensityRolled, isQuadrantRolled, isPlanetRolled, activePlanet]);

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
              difficulty={difficulty}
              areaDice={areaDice}
              densityDice={densityDice}
              quadrantDice={quadrantDice}
              isAreaRolled={isAreaRolled}
              isDensityRolled={isDensityRolled}
              isQuadrantRolled={isQuadrantRolled}
              areaRoll={areaRoll}
              densityRoll={densityRoll}
              density={density}
              startCol={startCol}
              startRow={startRow}
              onAreaDiceChange={setAreaDice}
              onDensityDiceChange={setDensityDice}
              onQuadrantDiceChange={setQuadrantDice}
            />
          )}

          {currentStep === 'planeta' && (
            <SetupStepPlanet
              difficulty={difficulty}
              dice3D6={dice3D6}
              isPlanetRolled={isPlanetRolled}
              rawRolledCode={rawRolledCode}
              activePlanet={activePlanet}
              activeValidation={activeValidation}
              consecutiveDetails={consecutiveDetails}
              onDice3D6Change={setDice3D6}
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
              areaRoll={areaRoll || 2}
              startCol={startCol || 'A'}
              startRow={startRow || 1}
              density={density || 'Media'}
              activePlanet={activePlanet || { name: 'Por determinar', code: 111 } as PlanetData}
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
                disabled={!canAdvanceCurrentStep}
                onClick={() => {
                  if (currentStep === 'empresa') setCurrentStep('ubicacion');
                  if (currentStep === 'ubicacion') setCurrentStep('planeta');
                  if (currentStep === 'planeta') setCurrentStep('tripulacion');
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 text-xs transition-colors shadow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvanceCurrentStep}
                onClick={handleFinalize}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Rocket className="w-4 h-4" />
                <span>Fundar Compañía e Iniciar Campaña</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para editar datos del planeta */}
      {planetForm && (
        <PlanetEditModal
          isOpen={isEditingPlanet}
          planetForm={planetForm}
          setPlanetForm={setPlanetForm as React.Dispatch<React.SetStateAction<PlanetData>>}
          onSave={handleSavePlanetEdit}
          onClose={() => setIsEditingPlanet(false)}
        />
      )}
    </div>
  );
}
