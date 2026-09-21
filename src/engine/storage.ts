import { GameSave, GameSummary } from '../types/game';
import { createInitialDate } from './calendar';
import { createInitialCompany } from './company';
import { createInitialUniverse } from './navigation';

const STORAGE_KEY = 'spacegom_saves_v1';

let memorySaves: GameSave[] = [];

export function loadAllSaves(): GameSave[] {
  try {
    if (typeof localStorage === 'undefined') return memorySaves;
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

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } else {
    memorySaves = all;
  }
}

export function deleteGame(id: string): void {
  const all = loadAllSaves().filter(g => g.id !== id);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } else {
    memorySaves = all;
  }
}

export interface NewGameOptions {
  saveName?: string;
  companyName?: string;
  shipName?: string;
  difficulty?: 'facil' | 'normal' | 'dificil';
  initialTreasury?: number;
  crewNames?: string[];
  areaId?: number;
  density?: 'Baja' | 'Media' | 'Alta';
  col?: string;
  row?: number;
  planetCode?: number;
  customPlanets?: Record<number, any>;
}

export function createNewGame(
  companyNameOrOptions: string | NewGameOptions = 'Starblack',
  legacySaveName?: string
): GameSave {
  const opts: NewGameOptions = typeof companyNameOrOptions === 'object'
    ? companyNameOrOptions
    : { companyName: companyNameOrOptions, saveName: legacySaveName };

  const companyName = opts.companyName?.trim() || 'Starblack';
  const shipName = opts.shipName?.trim() || 'Astronave I';
  const difficulty = opts.difficulty || 'normal';
  const saveName = opts.saveName?.trim() || `Campaña ${companyName}`;

  const company = createInitialCompany({
    name: companyName,
    shipName,
    difficulty,
    initialTreasury: opts.initialTreasury,
    crewNames: opts.crewNames
  });

  const universe = createInitialUniverse({
    manualArea: opts.areaId,
    manualDensity: opts.density,
    manualCol: opts.col,
    manualRow: opts.row,
    manualPlanetCode: opts.planetCode,
    customPlanets: opts.customPlanets
  });

  const date = createInitialDate();
  const currentPlanet = universe.areas[universe.currentAreaId]?.quadrants[`${universe.currentCol}${universe.currentRow}`]?.planetCode;

  const game: GameSave = {
    id: `save_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: saveName,
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
        details: `Compañía "${company.name}" fundada con nave "${company.ship.name}", ${company.treasury} SC (Dificultad ${difficulty.toUpperCase()}) y 11 tripulantes (76 SC/mes). Base inicial en Cuadrante ${universe.currentCol}${universe.currentRow}, Área ${universe.currentAreaId} (Densidad ${universe.areas[universe.currentAreaId]?.density || 'Media'}), Planeta #${currentPlanet || 'Descubierto'}.`,
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
