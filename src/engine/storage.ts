import { GameSave, GameSummary } from '../types/game';
import { createInitialDate } from './calendar';
import { createInitialCompany } from './company';
import { createInitialUniverse } from './navigation';

const STORAGE_KEY = 'spacegom_saves_v1';

export function loadAllSaves(): GameSave[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error cargando partidas:', err);
    return [];
  }
}

export function saveGame(game: GameSave): void {
  const all = loadAllSaves();
  const index = all.findIndex(g => g.id === game.id);
  const updated = {
    ...game,
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteGame(id: string): void {
  const all = loadAllSaves().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function createNewGame(companyName = 'Starblack', saveName?: string): GameSave {
  const company = createInitialCompany(companyName);
  const universe = createInitialUniverse();
  const date = createInitialDate();

  const game: GameSave = {
    id: `save_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: saveName || `Campaña ${companyName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    date,
    company,
    universe,
    tradeOrders: [],
    missions: [],
    auditLog: [
      {
        id: `init_log_${Date.now()}`,
        gameDate: date,
        category: 'sistema',
        action: 'Partida Creada',
        details: `Compañía ${companyName} fundada con 400 SC y 11 tripulantes.`,
        timestamp: new Date().toISOString()
      }
    ]
  };

  saveGame(game);
  return game;
}

export function getGameSummaries(): GameSummary[] {
  return loadAllSaves().map(g => ({
    id: g.id,
    name: g.name,
    companyName: g.company.name,
    reputation: g.company.reputation,
    treasury: g.company.treasury,
    date: g.date,
    exploredPlanetsCount: g.universe.usedPlanetCodes.length,
    exploredSectorsCount: Object.keys(g.universe.areas).length,
    employeesCount: g.company.employees.filter(e => e.isActive).length,
    updatedAt: g.updatedAt
  }));
}
