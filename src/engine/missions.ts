import { CompanyState } from '../types/company';
import { 
  CampaignObjective, 
  GameMission, 
  MissionStatus 
} from '../types/missions';

export const OBJECTIVE_1_REQUIRED_POSITIONS = [
  'Responsable de soporte a pasajeros',
  'Auxiliar de vuelo',
  'Negociador de compraventa de mercadería',
  'Técnico de mantenimiento de astronaves',
  'Técnico de soportes vitales',
  'Abogado'
];

/**
 * Crea el registro reglamentario del Primer Objetivo de la Campaña (1).
 *
 * Fuente: Documento primer_objetivo.md y Libro de Campaña Spacegom:
 * - Objetivo: Contratar la plantilla básica inicial para operar comercialmente.
 * - Puestos requeridos:
 *     1. Responsable de soporte a pasajeros
 *     2. Auxiliar de vuelo
 *     3. Negociador de compraventa de mercadería
 *     4. Técnico de mantenimiento de astronaves
 *     5. Técnico de soportes vitales
 *     6. Abogado
 */
export function createCampaignObjective1(
  acceptedPlanetCode: number,
  acceptedPlanetName: string
): CampaignObjective {
  return {
    id: `obj_campana_1_${Date.now()}`,
    category: 'campana',
    objectiveNumber: 1,
    title: 'Objetivo de Campaña nº 1: Contratación de Plantilla',
    description: 'Contratar para la compañía: 1 Responsable de soporte a pasajeros, 1 Auxiliar de vuelo, 1 Negociador de compraventa, 1 Técnico de mantenimiento, 1 Técnico de soportes vitales y 1 Abogado.',
    acceptedPlanetCode,
    acceptedPlanetName,
    executionLocation: 'Superficie de MUNDO (Rudimentario / Espacial)',
    maxDate: 'Sin fecha límite',
    status: 'en_curso',
    notes: 'Requiere búsqueda individual secuencial por parte del Director Gerente.'
  };
}

/**
 * Evalúa el progreso del Objetivo nº 1 comprobando los puestos de los empleados activos.
 */
export function checkObjective1Progress(company: CompanyState): {
  isComplete: boolean;
  fulfilledCount: number;
  totalRequired: number;
  positionsStatus: Array<{ position: string; fulfilled: boolean; employeeName?: string }>;
} {
  const activeEmployees = company.employees.filter(e => e.isActive);

  const positionsStatus = OBJECTIVE_1_REQUIRED_POSITIONS.map(requiredPos => {
    const found = activeEmployees.find(e => 
      e.position.toLowerCase().includes(requiredPos.toLowerCase()) ||
      requiredPos.toLowerCase().includes(e.position.toLowerCase())
    );

    return {
      position: requiredPos,
      fulfilled: Boolean(found),
      employeeName: found?.name
    };
  });

  const fulfilledCount = positionsStatus.filter(p => p.fulfilled).length;

  return {
    isComplete: fulfilledCount === OBJECTIVE_1_REQUIRED_POSITIONS.length,
    fulfilledCount,
    totalRequired: OBJECTIVE_1_REQUIRED_POSITIONS.length,
    positionsStatus
  };
}

/**
 * Añade una misión u objetivo al registro.
 */
export function addMission(missions: GameMission[] = [], mission: GameMission): GameMission[] {
  return [mission, ...missions];
}

/**
 * Actualiza el resultado de una misión o desbloquea su estado (en_curso, exito, fracaso).
 */
export function updateMissionStatus(
  missions: GameMission[] = [],
  missionId: string,
  status: MissionStatus
): GameMission[] {
  return missions.map(m => {
    if (m.id === missionId) {
      return {
        ...m,
        status
      };
    }
    return m;
  });
}
