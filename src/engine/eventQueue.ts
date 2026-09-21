import { GameDate } from '../types/common';
import { GameEvent } from '../types/events';
import { GameSave } from '../types/game';
import { 
  advanceDays, 
  compareDates, 
  dateToAbsoluteDays, 
  daysUntilNextPayday,
  DAYS_PER_MONTH 
} from './calendar';
import { performMonthlyAdministration, performWeeklyAdministration } from './administration';

/**
 * Añade un evento a la cola y la mantiene ordenada cronológicamente
 */
export function addEvent(
  events: GameEvent[] = [], 
  eventData: Omit<GameEvent, 'id' | 'createdAt'>
): GameEvent[] {
  const newEvent: GameEvent = {
    ...eventData,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString()
  };

  const updated = [...events, newEvent];
  return sortEvents(updated);
}

/**
 * Ordena eventos cronológicamente por fecha objetivo
 */
export function sortEvents(events: GameEvent[]): GameEvent[] {
  return [...events].sort((a, b) => compareDates(a.targetDate, b.targetDate));
}

/**
 * Elimina un evento de la cola
 */
export function removeEvent(events: GameEvent[] = [], eventId: string): GameEvent[] {
  return events.filter(e => e.id !== eventId);
}

/**
 * Obtiene el próximo evento de la cola (el más cercano en el tiempo)
 */
export function getNextEvent(events: GameEvent[] = []): GameEvent | null {
  if (events.length === 0) return null;
  const sorted = sortEvents(events);
  return sorted[0];
}

export interface NextMilestoneInfo {
  days: number;
  reason: string;
  event: GameEvent | null;
  isPayday: boolean;
  targetDate: GameDate;
}

/**
 * Calcula los días necesarios para alcanzar el siguiente hito temporal:
 * - El próximo evento programado en la cola.
 * - O el día 35 del mes actual (pago de salarios y nóminas), lo que ocurra antes.
 */
export function calculateNextMilestone(currentDate: GameDate, events: GameEvent[] = []): NextMilestoneInfo {
  const daysToPayday = daysUntilNextPayday(currentDate);
  const nextEvent = getNextEvent(events);

  if (!nextEvent) {
    const adv = advanceDays(currentDate, daysToPayday);
    return {
      days: daysToPayday,
      reason: `Cierre del mes (Día ${DAYS_PER_MONTH}): Pago de nóminas y administración`,
      event: null,
      isPayday: true,
      targetDate: adv.newDate
    };
  }

  const currentAbs = dateToAbsoluteDays(currentDate);
  const eventAbs = dateToAbsoluteDays(nextEvent.targetDate);
  const daysToEvent = Math.max(0, eventAbs - currentAbs);

  // Si el día 35 ocurre antes o al mismo tiempo que el evento, nos detenemos en el día 35
  if (daysToPayday < daysToEvent) {
    const adv = advanceDays(currentDate, daysToPayday);
    return {
      days: daysToPayday,
      reason: `Cierre del mes (Día ${DAYS_PER_MONTH}): Pago de nóminas y administración`,
      event: null,
      isPayday: true,
      targetDate: adv.newDate
    };
  }

  // Si el evento ocurre el mismo día o antes que el día 35
  const isAlsoPayday = daysToEvent === daysToPayday;
  return {
    days: daysToEvent,
    reason: nextEvent.title,
    event: nextEvent,
    isPayday: isAlsoPayday,
    targetDate: nextEvent.targetDate
  };
}

export interface AdvanceMilestoneResult {
  nextGame: GameSave;
  daysAdvanced: number;
  milestoneType: 'payday' | 'event' | 'both';
  resolvedEvent: GameEvent | null;
  logNotes: string[];
}

/**
 * Avanza el juego hasta el siguiente hito temporal (evento o día 35)
 */
export function advanceTimeToMilestone(
  game: GameSave,
  eventResolver?: (event: GameEvent, currentGame: GameSave) => { updatedGame: GameSave; notes: string[] }
): AdvanceMilestoneResult {
  const events = game.events || [];
  const milestone = calculateNextMilestone(game.date, events);
  const daysToAdvance = Math.max(1, milestone.days);

  const adv = advanceDays(game.date, daysToAdvance);
  let company = { ...game.company };
  const logNotes: string[] = [];

  // 1. Administración semanal si aplica
  if (adv.isWeeklyAdminDue) {
    const weekly = performWeeklyAdministration(company);
    company = weekly.nextCompany;
    logNotes.push(...weekly.logNotes);
  }

  // 2. Administración mensual (Día 35)
  let milestoneType: 'payday' | 'event' | 'both' = milestone.isPayday ? 'payday' : 'event';
  if (adv.isMonthlyAdminDue) {
    const monthly = performMonthlyAdministration(company);
    company = monthly.nextCompany;
    logNotes.push(...monthly.logNotes);
    if (milestone.event) milestoneType = 'both';
  }

  let nextEvents = [...events];
  let resolvedEvent: GameEvent | null = null;
  let runningGame: GameSave = {
    ...game,
    date: adv.newDate,
    company,
    events: nextEvents
  };

  // 3. Resolución de evento si se alcanzó su fecha
  if (milestone.event && daysToAdvance === milestone.days) {
    resolvedEvent = milestone.event;
    nextEvents = removeEvent(nextEvents, milestone.event.id);
    runningGame.events = nextEvents;

    if (eventResolver) {
      const res = eventResolver(milestone.event, runningGame);
      runningGame = res.updatedGame;
      logNotes.push(...res.notes);
    } else {
      logNotes.push(`Evento alcanzado: ${milestone.event.title}.`);
    }
  }

  // 4. Actualizar estado de empleados que estuvieran ocupados hasta esta fecha
  const updatedEmployees = runningGame.company.employees.map(emp => {
    if (emp.isBusy && emp.busyUntilDate && compareDates(runningGame.date, emp.busyUntilDate) >= 0) {
      return {
        ...emp,
        isBusy: false,
        busyReason: undefined,
        busyUntilDate: undefined
      };
    }
    return emp;
  });

  runningGame.company = {
    ...runningGame.company,
    employees: updatedEmployees
  };

  // 5. Registrar en Audit Log
  const newLogEntry = {
    id: `log_time_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    gameDate: adv.newDate,
    category: 'calendario' as const,
    action: `Tiempo avanzado (+${daysToAdvance}d)`,
    details: logNotes.join(' | ') || `Avanzado hasta ${milestone.reason}.`,
    timestamp: new Date().toISOString()
  };

  runningGame.auditLog = [newLogEntry, ...runningGame.auditLog];

  return {
    nextGame: runningGame,
    daysAdvanced: daysToAdvance,
    milestoneType,
    resolvedEvent,
    logNotes
  };
}
