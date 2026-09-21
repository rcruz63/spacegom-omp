import { describe, it, expect } from 'vitest';
import { 
  addEvent, 
  removeEvent, 
  getNextEvent, 
  calculateNextMilestone, 
  advanceTimeToMilestone 
} from './eventQueue';
import { 
  startHiringSearch, 
  resolveHiringEvent, 
  getAvailablePositionsForPlanet 
} from './hiring';
import { createNewGame } from './storage';
import { createInitialDate } from './calendar';
import { GameEvent } from '../types/events';
import { PLANETS_BY_CODE } from './universe';

describe('Event Queue & Time Management Engine', () => {
  it('adds and sorts events chronologically', () => {
    let events: GameEvent[] = [];
    
    events = addEvent(events, {
      type: 'custom_task',
      title: 'Evento Tardío',
      description: 'Día 10 Mes 1',
      targetDate: { year: 2880, month: 1, day: 10 }
    });

    events = addEvent(events, {
      type: 'hire_resolution',
      title: 'Evento Temprano',
      description: 'Día 5 Mes 1',
      targetDate: { year: 2880, month: 1, day: 5 }
    });

    const next = getNextEvent(events);
    expect(next?.title).toBe('Evento Temprano');
    expect(next?.targetDate.day).toBe(5);

    const removed = removeEvent(events, next!.id);
    expect(removed.length).toBe(1);
    expect(removed[0].title).toBe('Evento Tardío');
  });

  it('calculates next milestone: targets event when it occurs before day 35', () => {
    const current = createInitialDate(2880, 1, 1);
    const events: GameEvent[] = [
      {
        id: 'evt_1',
        type: 'hire_resolution',
        title: 'Búsqueda Abogado',
        description: 'Día 6',
        targetDate: { year: 2880, month: 1, day: 6 },
        createdAt: new Date().toISOString()
      }
    ];

    const milestone = calculateNextMilestone(current, events);
    expect(milestone.days).toBe(5); // from 1 to 6 is 5 days
    expect(milestone.isPayday).toBe(false);
    expect(milestone.event?.title).toBe('Búsqueda Abogado');
  });

  it('calculates next milestone: stops at day 35 when event is after day 35', () => {
    const current = createInitialDate(2880, 1, 30);
    // Next payday is day 35 (5 days away)
    // An event is scheduled for day 5 of month 2 (10 days away)
    const events: GameEvent[] = [
      {
        id: 'evt_2',
        type: 'custom_task',
        title: 'Misión Lejana',
        description: 'Día 5 Mes 2',
        targetDate: { year: 2880, month: 2, day: 5 },
        createdAt: new Date().toISOString()
      }
    ];

    const milestone = calculateNextMilestone(current, events);
    expect(milestone.days).toBe(5);
    expect(milestone.isPayday).toBe(true);
    expect(milestone.reason).toContain('Día 35');
  });

  it('advances time to milestone and executes monthly payroll on day 35', () => {
    let game = createNewGame({
      saveName: 'Test Payroll',
      difficulty: 'normal' // 500 SC
    });

    // Start at Day 30
    game.date = { year: 2880, month: 1, day: 30 };
    const initialTreasury = game.company.treasury;

    const res = advanceTimeToMilestone(game);
    expect(res.daysAdvanced).toBe(5);
    expect(res.nextGame.date.day).toBe(35);
    expect(res.milestoneType).toBe('payday');
    expect(res.nextGame.company.treasury).toBeLessThan(initialTreasury);
    expect(res.logNotes.some(n => n.includes('nóminas') || n.includes('salarios'))).toBe(true);
  });
});

describe('Hiring Engine & Director Gerente Flow', () => {
  it('filters available positions by planet technology', () => {
    const p111 = PLANETS_BY_CODE[111]; // Chipethea
    const available = getAvailablePositionsForPlanet(p111);
    expect(available.length).toBeGreaterThan(0);
    expect(available.some(p => p.title === 'Abogado')).toBe(true);
  });

  it('initiates search, marks Director Gerente as busy and schedules event', () => {
    let game = createNewGame({ saveName: 'Test Hiring' });
    const directorBefore = game.company.employees.find(e => e.position.toLowerCase().includes('director gerente'))!;
    expect(directorBefore.isBusy).toBeFalsy();

    const search = startHiringSearch(
      game,
      'Abogado',
      'estandar',
      'Elena Rostova',
      4 // 4 days manual roll
    );

    expect(search.searchDays).toBe(4);
    expect(search.nextGame.events?.length).toBe(1);

    const directorAfter = search.nextGame.company.employees.find(e => e.id === directorBefore.id)!;
    expect(directorAfter.isBusy).toBe(true);
    expect(directorAfter.busyReason).toContain('Abogado');

    // Should reject starting a second search while busy
    expect(() => {
      startHiringSearch(search.nextGame, 'Piloto', 'estandar');
    }).toThrow(/ocupado/);
  });

  it('resolves hiring event: success adds employee and frees director', () => {
    let game = createNewGame({ saveName: 'Test Hiring Resolution' });
    const search = startHiringSearch(game, 'Auxiliar de vuelo', 'estandar', 'Sofía Gómez', 2);
    
    // Target threshold for Auxiliar de vuelo is 7+
    // Roll [5, 4] = 9 + mods -> definitely success
    const resolution = resolveHiringEvent(search.nextGame, search.event, [5, 4]);
    expect(resolution.success).toBe(true);
    expect(resolution.newEmployee).toBeDefined();
    expect(resolution.newEmployee?.name).toBe('Sofía Gómez');
    expect(resolution.newEmployee?.position).toBe('Auxiliar de vuelo');

    const directorAfter = resolution.nextGame.company.employees.find(e => e.position.toLowerCase().includes('director gerente'))!;
    expect(directorAfter.isBusy).toBe(false);

    // Verify employee was added to crew
    const hasEmployee = resolution.nextGame.company.employees.some(e => e.name === 'Sofía Gómez');
    expect(hasEmployee).toBe(true);
  });

  it('resolves hiring event: failure logs attempt and frees director without adding employee', () => {
    let game = createNewGame({ saveName: 'Test Hiring Failure' });
    const search = startHiringSearch(game, 'Abogado', 'veterano', 'Marcus Vance', 4);

    // Abogado threshold is 8+. Roll [1, 1] = 2 -> failure
    const resolution = resolveHiringEvent(search.nextGame, search.event, [1, 1]);
    expect(resolution.success).toBe(false);
    expect(resolution.newEmployee).toBeUndefined();

    const hasEmployee = resolution.nextGame.company.employees.some(e => e.name === 'Marcus Vance');
    expect(hasEmployee).toBe(false);

    const directorAfter = resolution.nextGame.company.employees.find(e => e.position.toLowerCase().includes('director gerente'))!;
    expect(directorAfter.isBusy).toBe(false);
  });
});
