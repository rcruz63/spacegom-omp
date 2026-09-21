import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { 
  CampaignObjective, 
  SpecialMission, 
  MissionStatus 
} from '../../types/missions';
import { 
  createCampaignObjective1, 
  addMission, 
  updateMissionStatus 
} from '../../engine/missions';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { CampaignObjectivesList } from '../missions/CampaignObjectivesList';
import { SpecialMissionsList } from '../missions/SpecialMissionsList';
import { 
  ScrollText, 
  Target, 
  BookOpen 
} from 'lucide-react';

interface MissionsViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

type MissionTab = 'campana' | 'especiales';

export function MissionsView({ game, onUpdateGame }: MissionsViewProps) {
  const [activeTab, setActiveTab] = useState<MissionTab>('campana');

  const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;
  const originPlanet = game.universe.originPlanetCode ? PLANETS_BY_CODE[game.universe.originPlanetCode] : currentPlanet;

  const currentPlanetName = currentPlanet?.name || 'Mundo Actual';
  const currentPlanetCode = currentPlanet?.code || 111;

  // Separar misiones de campaña y especiales
  const campaignObjectives = useMemo(() => {
    return (game.missions || []).filter((m): m is CampaignObjective => m.category === 'campana');
  }, [game.missions]);

  const specialMissions = useMemo(() => {
    return (game.missions || []).filter((m): m is SpecialMission => m.category === 'especial' || !m.category);
  }, [game.missions]);

  // Activar el Objetivo nº 1
  const handleActivateObjective1 = () => {
    const acceptedCode = originPlanet?.code || currentPlanetCode;
    const acceptedName = originPlanet?.name || currentPlanetName;

    const newObj = createCampaignObjective1(acceptedCode, acceptedName);

    const updatedLog = [
      {
        id: `log_obj1_${Date.now()}`,
        gameDate: game.date,
        category: 'misiones' as const,
        action: 'Activado Objetivo de Campaña nº 1',
        details: `Iniciado Objetivo de Campaña nº 1 en ${acceptedName} (#${acceptedCode}): Contratación de los 6 puestos clave de la compañía.`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      missions: addMission(game.missions, newObj),
      auditLog: updatedLog
    });
  };

  // Actualizar estado de Objetivo de Campaña (en_curso, exito, fracaso)
  const handleUpdateCampaignStatus = (id: string, status: MissionStatus) => {
    const target = campaignObjectives.find(o => o.id === id);
    if (!target) return;

    const updatedMissions = updateMissionStatus(game.missions, id, status);

    const statusLabels: Record<MissionStatus, string> = {
      en_curso: 'Reabierto (En curso)',
      exito: '✓ Éxito Cumplido',
      fracaso: '✗ Fracaso'
    };

    const updatedLog = [
      {
        id: `log_obj_status_${Date.now()}`,
        gameDate: game.date,
        category: 'misiones' as const,
        action: `Objetivo #${target.objectiveNumber}: ${statusLabels[status]}`,
        details: `El jugador ha actualizado el resultado del Objetivo nº ${target.objectiveNumber} a "${statusLabels[status]}".`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      missions: updatedMissions,
      auditLog: updatedLog
    });
  };

  // Añadir Misión Especial secundaria
  const handleAddSpecialMission = (data: Omit<SpecialMission, 'id' | 'category'>) => {
    const newMission: SpecialMission = {
      ...data,
      id: `special_mis_${Date.now()}`,
      category: 'especial'
    };

    const updatedLog = [
      {
        id: `log_add_spec_${Date.now()}`,
        gameDate: game.date,
        category: 'misiones' as const,
        action: 'Aceptada Misión Especial',
        details: `Misión ${newMission.code} (${newMission.title}) aceptada en ${newMission.acceptedPlanetName}. Recompensa: +${newMission.rewardSC} SC. Pág. ${newMission.bookPage} del Libro.`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      missions: addMission(game.missions, newMission),
      auditLog: updatedLog
    });
  };

  // Resolver Misión Especial secundaria (éxito con recompensa SC o fallo)
  const handleResolveSpecialMission = (id: string, success: boolean) => {
    const target = specialMissions.find(m => m.id === id);
    if (!target) return;

    let treasury = game.company.treasury;
    let reputation = game.company.reputation;

    if (success) {
      treasury += target.rewardSC;
      reputation += 1;
    } else {
      reputation = Math.max(0, reputation - 1);
    }

    const updatedMissions = updateMissionStatus(
      game.missions, 
      id, 
      success ? 'exito' : 'fracaso'
    );

    const updatedLog = [
      {
        id: `log_spec_res_${Date.now()}`,
        gameDate: game.date,
        category: 'misiones' as const,
        action: success ? `Misión ${target.code} Superada` : `Misión ${target.code} Fracasada`,
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

  // Reabrir Misión Especial
  const handleReopenSpecialMission = (id: string) => {
    const updatedMissions = updateMissionStatus(game.missions, id, 'en_curso');
    onUpdateGame({
      ...game,
      missions: updatedMissions
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal de Misiones */}
      <div className="bg-space-800 border border-space-700 rounded-2xl p-6 shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <ScrollText className="w-5 h-5 text-space-accent" />
            <span>Registro Oficial de Misiones y Objetivos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión del hilo argumental del Libro de Campaña y contratos especiales de Spacegom
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2 bg-space-900/80 p-1.5 rounded-xl border border-space-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('campana')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'campana'
                ? 'bg-space-accent text-space-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Objetivos de Campaña ({campaignObjectives.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('especiales')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'especiales'
                ? 'bg-space-accent text-space-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Misiones Especiales ({specialMissions.length})</span>
          </button>
        </div>
      </div>

      {/* Contenido de la Pestaña Activa */}
      {activeTab === 'campana' ? (
        <CampaignObjectivesList
          objectives={campaignObjectives}
          company={game.company}
          currentPlanetName={currentPlanetName}
          onActivateObjective1={handleActivateObjective1}
          onUpdateStatus={handleUpdateCampaignStatus}
        />
      ) : (
        <SpecialMissionsList
          missions={specialMissions}
          currentPlanetName={currentPlanetName}
          currentPlanetCode={currentPlanetCode}
          onAddMission={handleAddSpecialMission}
          onResolveMission={handleResolveSpecialMission}
          onReopenMission={handleReopenSpecialMission}
        />
      )}
    </div>
  );
}
