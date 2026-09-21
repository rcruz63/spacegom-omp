import { describe, it, expect } from 'vitest';
import { rollDice, roll2D6 } from './dice';
import { createInitialDate, advanceDays, dateToAbsoluteDays, absoluteDaysToDate, formatDate } from './calendar';
import { createAuditLog, addLogEntry, exportLogToText } from './auditLog';

describe('Dice Engine', () => {
  it('rolls 2D6 within expected range 2-12', () => {
    const res = roll2D6();
    expect(res.diceCount).toBe(2);
    expect(res.sum).toBeGreaterThanOrEqual(2);
    expect(res.sum).toBeLessThanOrEqual(12);
    expect(res.total).toBe(res.sum);
  });

  it('accepts manual rolls and applies modifiers', () => {
    const res = roll2D6([{ label: 'Moral', value: 1 }, { label: 'Exp', value: -1 }], 'Test', [5, 6]);
    expect(res.isManual).toBe(true);
    expect(res.rolls).toEqual([5, 6]);
    expect(res.sum).toBe(11);
    expect(res.total).toBe(11); // +1 - 1 = 0
  });

  it('identifies double 6 correctly', () => {
    const res = rollDice({ diceCount: 2, manualRolls: [6, 6] });
    expect(res.isDoubleSix).toBe(true);
  });
});

describe('Calendar Engine', () => {
  it('formats initial date correctly', () => {
    const d = createInitialDate();
    expect(formatDate(d)).toBe('Día 01 / Mes 01 / Año 2880');
  });

  it('advances days and detects weekly/monthly admin due on day 35', () => {
    const start = createInitialDate(2880, 1, 1);
    // Advance 6 days -> Día 7 (Semanal)
    const adv1 = advanceDays(start, 6);
    expect(adv1.newDate).toEqual({ year: 2880, month: 1, day: 7 });
    expect(adv1.isWeeklyAdminDue).toBe(true);
    expect(adv1.isMonthlyAdminDue).toBe(false);

    // Advance 21 more days -> Día 28 (Semanal, pero aún no mensual en mes de 35 días)
    const adv2 = advanceDays(adv1.newDate, 21);
    expect(adv2.newDate).toEqual({ year: 2880, month: 1, day: 28 });
    expect(adv2.isWeeklyAdminDue).toBe(true);
    expect(adv2.isMonthlyAdminDue).toBe(false);

    // Advance 7 more days -> Día 35 (Semanal + Cierre Mensual y nóminas)
    const adv3 = advanceDays(adv2.newDate, 7);
    expect(adv3.newDate).toEqual({ year: 2880, month: 1, day: 35 });
    expect(adv3.isWeeklyAdminDue).toBe(true);
    expect(adv3.isMonthlyAdminDue).toBe(true);

    // Advance 1 day -> Día 1 Mes 2
    const adv4 = advanceDays(adv3.newDate, 1);
    expect(adv4.newDate).toEqual({ year: 2880, month: 2, day: 1 });
  });

  it('converts to absolute days and back accurately', () => {
    const d = { year: 2880, month: 5, day: 14 };
    const abs = dateToAbsoluteDays(d);
    const restored = absoluteDaysToDate(abs);
    expect(restored).toEqual(d);
  });
});

describe('Audit Log Engine', () => {
  it('records entries and exports readable text', () => {
    let log = createAuditLog();
    const d = createInitialDate(2880, 1, 1);

    const step1 = addLogEntry(log, {
      gameDate: d,
      category: 'tesoreria',
      action: 'Inicio partida',
      details: 'Saldo inicial de tesorería',
      previousValue: 0,
      newValue: 500
    });
    log = step1.nextState;

    expect(log.entries).toHaveLength(1);
    const text = exportLogToText(log.entries);
    expect(text).toContain('[TESORERIA] Inicio partida');
    expect(text).toContain('500');
  });
});
