import { describe, it, expect } from 'vitest';
import { 
  enqueueHiringTask, 
  cancelHiringTask, 
  resolveHiringEvent 
} from './hiring';
import { createNewGame } from './storage';

describe('Director Gerente Task Queue Engine', () => {
  it('starts task immediately when director is free', () => {
    const game = createNewGame({ saveName: 'Test Queue 1' });
    const res = enqueueHiringTask(game, 'Abogado', 'estandar', 'Marcus Vance', 4);

    expect(res.isEnqueued).toBe(false);
    expect(res.task.status).toBe('activa');
    expect(res.nextGame.directorTasks).toHaveLength(1);
    expect(res.nextGame.events).toHaveLength(1);

    const director = res.nextGame.company.employees.find(e => e.position.toLowerCase().includes('director gerente'))!;
    expect(director.isBusy).toBe(true);
    expect(director.busyReason).toContain('Abogado');
  });

  it('enqueues second task sequentially when director is already busy', () => {
    let game = createNewGame({ saveName: 'Test Queue 2' });
    
    // Tarea 1: 4 días
    const res1 = enqueueHiringTask(game, 'Abogado', 'estandar', 'Marcus Vance', 4);
    game = res1.nextGame;

    // Tarea 2: 2 días (se encola tras la tarea 1)
    const res2 = enqueueHiringTask(game, 'Auxiliar de vuelo', 'estandar', 'Sofía Gómez', 2);
    game = res2.nextGame;

    expect(res2.isEnqueued).toBe(true);
    expect(res2.task.status).toBe('encolada');
    expect(game.directorTasks).toHaveLength(2);

    // Solo debe haber 1 evento en la cola activa (el de la tarea 1)
    expect(game.events).toHaveLength(1);
    expect(game.events![0].title).toContain('Abogado');

    // Fechas encadenadas
    const task1 = game.directorTasks![0];
    const task2 = game.directorTasks![1];
    expect(task2.startDate).toEqual(task1.targetDate);
  });

  it('automatically promotes next queued task when current task is resolved', () => {
    let game = createNewGame({ saveName: 'Test Queue 3' });
    
    const res1 = enqueueHiringTask(game, 'Abogado', 'estandar', 'Marcus Vance', 3);
    game = res1.nextGame;

    const res2 = enqueueHiringTask(game, 'Auxiliar de vuelo', 'estandar', 'Sofía Gómez', 2);
    game = res2.nextGame;

    expect(game.directorTasks).toHaveLength(2);
    expect(game.directorTasks![1].status).toBe('encolada');

    // Resolver la tarea 1 (Abogado)
    const activeEvent = game.events![0];
    const resolveRes = resolveHiringEvent(game, activeEvent, [5, 5]);
    game = resolveRes.nextGame;

    // La tarea 2 ahora debe ser activa
    expect(game.directorTasks).toHaveLength(1);
    expect(game.directorTasks![0].status).toBe('activa');
    expect(game.directorTasks![0].positionKey).toBe('Auxiliar de vuelo');

    // El evento en game.events ahora es el de Auxiliar de vuelo
    expect(game.events).toHaveLength(1);
    expect(game.events![0].title).toContain('Auxiliar de vuelo');

    // El director sigue ocupado con la tarea 2
    const director = game.company.employees.find(e => e.position.toLowerCase().includes('director gerente'))!;
    expect(director.isBusy).toBe(true);
    expect(director.busyReason).toContain('Auxiliar de vuelo');
  });

  it('cancels a queued task without affecting active task', () => {
    let game = createNewGame({ saveName: 'Test Queue 4' });
    
    const res1 = enqueueHiringTask(game, 'Abogado', 'estandar', 'Marcus Vance', 4);
    game = res1.nextGame;

    const res2 = enqueueHiringTask(game, 'Cocinero', 'estandar', 'Sam Hernández', 3);
    game = res2.nextGame;

    const queuedTask = game.directorTasks![1];
    expect(queuedTask.positionKey).toBe('Cocinero');

    // Cancelar la encolada
    game = cancelHiringTask(game, queuedTask.id);
    expect(game.directorTasks).toHaveLength(1);
    expect(game.directorTasks![0].positionKey).toBe('Abogado');
  });
});
