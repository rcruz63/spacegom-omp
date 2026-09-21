import { ExperienceLevel, MoraleLevel } from '../types/common';
import { Employee } from '../types/company';
import { PlanetData } from '../types/universe';
import { GameEvent } from '../types/events';
import { GameSave } from '../types/game';
import { rollDice, roll2D6 } from './dice';
import { advanceDays } from './calendar';
import { addEvent } from './eventQueue';
import { updateEmployeeAfterRoll } from './company';
import { PERSONNEL_NAMES, getUniqueRandomItems } from '../data/names';
import { PositionDefinition, POSITIONS_CATALOG } from '../data/positionsCatalog';

export type { PositionDefinition };
export { POSITIONS_CATALOG };

/**
 * Obtiene los puestos contratables según el mundo actual
 */
export function getAvailablePositionsForPlanet(planet: PlanetData | null): PositionDefinition[] {
  if (!planet || planet.population_over_1000 !== 1) {
    return [];
  }

  const techLower = (planet.tech_level || '').toLowerCase();
  if (techLower.includes('primitivo')) {
    return [];
  }

  const allPositions = Object.values(POSITIONS_CATALOG);

  // Si es rudimentario, solo puestos RUDIMENTARIO
  if (techLower.includes('rudimentario')) {
    return allPositions.filter(p => p.techLevel === 'RUDIMENTARIO');
  }

  // Si es espacial, RUDIMENTARIO + ESPACIAL
  if (techLower.includes('espacial') || techLower.includes('medio')) {
    return allPositions.filter(p => p.techLevel === 'RUDIMENTARIO' || p.techLevel === 'ESPACIAL');
  }

  // Si es avanzado / interestelar / político / superior, todos los puestos
  return allPositions;
}

/**
 * Calcula tiempo base y salario según nivel de experiencia
 */
export function calculateHiringParameters(
  positionKey: string,
  experience: ExperienceLevel,
  manualDiceResult?: number
): {
  searchDays: number;
  monthlySalary: number;
  hireThreshold: number;
  formula: string;
} {
  const def = POSITIONS_CATALOG[positionKey];
  if (!def) throw new Error(`Puesto desconocido: ${positionKey}`);

  let baseDays = 1;
  if (def.searchTimeDice === '1') baseDays = 1;
  else if (def.searchTimeDice === '2') baseDays = 2;
  else if (manualDiceResult !== undefined) baseDays = manualDiceResult;
  else if (def.searchTimeDice === '1d6') baseDays = rollDice({ diceCount: 1 }).rolls[0];
  else if (def.searchTimeDice === '2d6') baseDays = rollDice({ diceCount: 2 }).sum;
  else if (def.searchTimeDice === '3d6') baseDays = rollDice({ diceCount: 3 }).sum;

  let searchDays = baseDays;
  let monthlySalary = def.baseSalary;

  if (experience === 'novato') {
    searchDays = Math.max(1, Math.ceil(baseDays / 2));
    monthlySalary = Math.max(1, Math.ceil(def.baseSalary / 2));
  } else if (experience === 'veterano') {
    searchDays = baseDays * 2;
    monthlySalary = def.baseSalary * 2;
  }

  return {
    searchDays,
    monthlySalary,
    hireThreshold: def.hireThreshold,
    formula: def.searchTimeDice
  };
}

/**
 * Inicia la búsqueda de personal por parte del Director Gerente
 */
export function startHiringSearch(
  game: GameSave,
  positionKey: string,
  experience: ExperienceLevel,
  candidateName?: string,
  manualDiceResult?: number
): {
  nextGame: GameSave;
  event: GameEvent;
  searchDays: number;
  salary: number;
} {
  const director = game.company.employees.find(e => e.isActive && e.position.toLowerCase().includes('director gerente'));
  if (!director) {
    throw new Error('No hay Director Gerente en la compañía para realizar la búsqueda de personal.');
  }

  if (director.isBusy) {
    throw new Error(`El Director Gerente ya está ocupado: ${director.busyReason || 'tarea en curso'}.`);
  }

  const params = calculateHiringParameters(positionKey, experience, manualDiceResult);
  const targetDate = advanceDays(game.date, params.searchDays).newDate;

  const usedNames = game.company.employees.map(e => e.name);
  const finalCandidateName = candidateName?.trim() || getUniqueRandomItems(PERSONNEL_NAMES, 1, usedNames)[0] || 'Candidato Desconocido';

  const eventData = {
    type: 'hire_resolution' as const,
    title: `Candidato para ${positionKey}`,
    description: `Búsqueda de ${positionKey} (${experience.toUpperCase()}). Candidato propuesto: ${finalCandidateName}.`,
    targetDate,
    assignedEmployeeId: director.id,
    data: {
      positionKey,
      experience,
      candidateName: finalCandidateName,
      searchDays: params.searchDays,
      monthlySalary: params.monthlySalary,
      hireThreshold: params.hireThreshold
    }
  };

  const updatedEvents = addEvent(game.events || [], eventData);
  const scheduledEvent = updatedEvents.find(e => e.targetDate.day === targetDate.day && e.targetDate.month === targetDate.month && e.targetDate.year === targetDate.year && e.type === 'hire_resolution')!;

  // Ocupar al Director Gerente
  const updatedEmployees = game.company.employees.map(e => {
    if (e.id === director.id) {
      return {
        ...e,
        isBusy: true,
        busyReason: `Buscando ${positionKey} (${experience})`,
        busyUntilDate: targetDate
      };
    }
    return e;
  });

  const nextCompany = {
    ...game.company,
    employees: updatedEmployees
  };

  const newLogEntry = {
    id: `log_hire_start_${Date.now()}`,
    gameDate: game.date,
    category: 'tripulacion' as const,
    action: `Inicio búsqueda de ${positionKey}`,
    details: `El Director Gerente inicia la búsqueda de un ${positionKey} (${experience}). Duración prevista: ${params.searchDays} días (hasta Día ${targetDate.day} / Mes ${targetDate.month}). Salario pactado: ${params.monthlySalary} SC/mes.`,
    timestamp: new Date().toISOString()
  };

  return {
    nextGame: {
      ...game,
      company: nextCompany,
      events: updatedEvents,
      auditLog: [newLogEntry, ...game.auditLog]
    },
    event: scheduledEvent,
    searchDays: params.searchDays,
    salary: params.monthlySalary
  };
}

export interface ResolveHiringResult {
  nextGame: GameSave;
  success: boolean;
  diceRollSum: number;
  rollTotal: number;
  hireThreshold: number;
  newEmployee?: Employee;
  moraleChanged: boolean;
  expChanged: boolean;
  logNotes: string[];
}

/**
 * Resuelve la contratación cuando se alcanza la fecha del evento
 */
export function resolveHiringEvent(
  game: GameSave,
  event: GameEvent,
  manualDice?: [number, number]
): ResolveHiringResult {
  const data = event.data as {
    positionKey: string;
    experience: ExperienceLevel;
    candidateName: string;
    monthlySalary: number;
    hireThreshold: number;
  };

  if (!data) throw new Error('Datos de evento de contratación incompletos');

  const director = game.company.employees.find(e => e.id === event.assignedEmployeeId) ||
                   game.company.employees.find(e => e.isActive && e.position.toLowerCase().includes('director gerente'));

  const logNotes: string[] = [];
  
  // Tirada de 2D6 del Director Gerente
  const rollRes = manualDice 
    ? roll2D6([], 'Contratación', manualDice) 
    : rollDice({ diceCount: 2 });

  const diceSum = rollRes.sum;
  const isDoubleSix = rollRes.isDoubleSix;

  // Modificadores del Director: exp + moral + reputación/2 (redondeado a la baja)
  let directorMod = 0;
  if (director) {
    if (director.experience === 'veterano') directorMod += 1;
    if (director.experience === 'novato') directorMod -= 1;
    if (director.morale === 'alta') directorMod += 1;
    if (director.morale === 'baja') directorMod -= 1;
  }
  const repMod = Math.floor(game.company.reputation / 2);
  const totalMod = directorMod + repMod;
  const rollTotal = diceSum + totalMod;

  const success = rollTotal >= data.hireThreshold;
  let moraleChanged = false;
  let expChanged = false;

  // Actualizar moral y experiencia del Director
  let updatedEmployees = [...game.company.employees];
  if (director) {
    const dRes = updateEmployeeAfterRoll(director, rollTotal, isDoubleSix);
    moraleChanged = dRes.moraleChanged;
    expChanged = dRes.expChanged;
    logNotes.push(...dRes.logNotes);

    updatedEmployees = updatedEmployees.map(e => {
      if (e.id === director.id) {
        return {
          ...dRes.updatedEmployee,
          isBusy: false,
          busyReason: undefined,
          busyUntilDate: undefined
        };
      }
      return e;
    });
  }

  let newEmployee: Employee | undefined = undefined;

  if (success) {
    const newId = Math.max(0, ...game.company.employees.map(e => e.id)) + 1;
    newEmployee = {
      id: newId,
      name: data.candidateName,
      position: data.positionKey,
      monthlySalary: data.monthlySalary,
      experience: data.experience,
      morale: 'media' as MoraleLevel,
      isActive: true
    };
    updatedEmployees.push(newEmployee);
    logNotes.push(`¡CONTRATACIÓN EXITOSA! ${data.candidateName} se incorpora como ${data.positionKey} (${data.experience}) con un salario de ${data.monthlySalary} SC/mes. Tirada: ${diceSum} + Mod: ${totalMod} = ${rollTotal} (Supera umbral ${data.hireThreshold}+).`);
  } else {
    logNotes.push(`Contratación fallida de ${data.positionKey}. El candidato no aceptó la oferta. Tirada: ${diceSum} + Mod: ${totalMod} = ${rollTotal} (No iguala umbral ${data.hireThreshold}+).`);
  }

  const newLogEntry = {
    id: `log_hire_res_${Date.now()}`,
    gameDate: game.date,
    category: 'tripulacion' as const,
    action: success ? `Contratado: ${data.positionKey}` : `Falló contratación: ${data.positionKey}`,
    details: logNotes.join(' | '),
    timestamp: new Date().toISOString()
  };

  const nextCompany = {
    ...game.company,
    employees: updatedEmployees
  };

  return {
    nextGame: {
      ...game,
      company: nextCompany,
      auditLog: [newLogEntry, ...game.auditLog]
    },
    success,
    diceRollSum: diceSum,
    rollTotal,
    hireThreshold: data.hireThreshold,
    newEmployee,
    moraleChanged,
    expChanged,
    logNotes
  };
}
