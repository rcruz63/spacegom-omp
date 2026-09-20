import { GameDate } from '../types/common';

export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 28;
export const MONTHS_PER_YEAR = 12;
export const INITIAL_YEAR = 2880;

export interface CalendarAdvanceResult {
  previousDate: GameDate;
  newDate: GameDate;
  daysAdvanced: number;
  weeksCrossed: number[];
  monthsCrossed: number[];
  yearsCrossed: number[];
  isWeeklyAdminDue: boolean;
  isMonthlyAdminDue: boolean;
}

export function createInitialDate(year = INITIAL_YEAR, month = 1, day = 1): GameDate {
  return { year, month, day };
}

export function formatDate(date: GameDate): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `Día ${pad(date.day)} / Mes ${pad(date.month)} / Año ${date.year}`;
}

export function compareDates(a: GameDate, b: GameDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function dateToAbsoluteDays(date: GameDate): number {
  return (date.year * MONTHS_PER_YEAR * DAYS_PER_MONTH) + ((date.month - 1) * DAYS_PER_MONTH) + (date.day - 1);
}

export function absoluteDaysToDate(days: number): GameDate {
  const year = Math.floor(days / (MONTHS_PER_YEAR * DAYS_PER_MONTH));
  const remYear = days % (MONTHS_PER_YEAR * DAYS_PER_MONTH);
  const month = Math.floor(remYear / DAYS_PER_MONTH) + 1;
  const day = (remYear % DAYS_PER_MONTH) + 1;
  return { year, month, day };
}

export function advanceDays(current: GameDate, days: number): CalendarAdvanceResult {
  if (days < 0) {
    throw new Error('No se pueden retroceder días en el calendario');
  }

  const previousDate = { ...current };
  let currentAbs = dateToAbsoluteDays(current);
  const targetAbs = currentAbs + days;

  const weeksCrossed: number[] = [];
  const monthsCrossed: number[] = [];
  const yearsCrossed: number[] = [];

  let isWeeklyAdminDue = false;
  let isMonthlyAdminDue = false;

  for (let step = 1; step <= days; step++) {
    const dayDate = absoluteDaysToDate(currentAbs + step);
    
    // Administración semanal en días 7, 14, 21, 28
    if (dayDate.day % DAYS_PER_WEEK === 0) {
      isWeeklyAdminDue = true;
      weeksCrossed.push(dayDate.day / DAYS_PER_WEEK);
    }

    // Fin de mes en día 28
    if (dayDate.day === DAYS_PER_MONTH) {
      isMonthlyAdminDue = true;
      monthsCrossed.push(dayDate.month);
    }

    // Fin de año en mes 12 día 28
    if (dayDate.month === 1 && dayDate.day === 1 && step > 1) {
      yearsCrossed.push(dayDate.year);
    }
  }

  const newDate = absoluteDaysToDate(targetAbs);

  return {
    previousDate,
    newDate,
    daysAdvanced: days,
    weeksCrossed,
    monthsCrossed,
    yearsCrossed,
    isWeeklyAdminDue,
    isMonthlyAdminDue
  };
}
