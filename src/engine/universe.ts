import planetsJson from '../data/planets.json';
import { PlanetData, SectorArea, SectorQuadrant, UniverseState } from '../types/universe';
import { rollDice } from './dice';

export const ALL_PLANETS: PlanetData[] = planetsJson as unknown as PlanetData[];

export const PLANETS_BY_CODE: Record<number, PlanetData> = ALL_PLANETS.reduce((acc, p) => {
  acc[p.code] = p;
  return acc;
}, {} as Record<number, PlanetData>);

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4, 5, 6];

export function getQuadrantKey(col: string, row: number): string {
  return `${col.toUpperCase()}${row}`;
}

export function createSectorArea(id: number, density: 'Baja' | 'Media' | 'Alta'): SectorArea {
  const quadrants: Record<string, SectorQuadrant> = {};
  for (const c of COLS) {
    for (const r of ROWS) {
      const key = getQuadrantKey(c, r);
      quadrants[key] = {
        col: c,
        row: r,
        isConfigured: false,
        planetCode: null
      };
    }
  }

  return {
    id,
    density,
    quadrants,
    discoveredPlanets: []
  };
}

export function isValidStartingPlanet(p: PlanetData): boolean {
  if (p.population_over_1000 !== 1) return false;
  const techLower = (p.tech_level || '').toLowerCase();
  if (techLower.includes('primitivo') || techLower.includes('rudimentario')) return false;
  const lifeLower = (p.life_support || '').toLowerCase();
  if (lifeLower.includes('avanzado') || lifeLower.includes('hiperavanzado')) return false;
  if (p.convenio_spacegom !== 1) return false;

  const producesProduct = 
    p.product_indu > 0 || p.product_basi > 0 || p.product_alim > 0 ||
    p.product_made > 0 || p.product_agua > 0 || p.product_mico > 0 ||
    p.product_mira > 0 || p.product_mipr > 0 || p.product_pava > 0 ||
    p.product_a > 0 || p.product_ae > 0 || p.product_aei > 0 || p.product_com > 0;

  return producesProduct;
}

export function findFirstValidStartingPlanet(candidateCode: number, usedCodes: number[] = []): PlanetData {
  let startIndex = ALL_PLANETS.findIndex(p => p.code === candidateCode);
  if (startIndex === -1) startIndex = 0;

  const total = ALL_PLANETS.length;
  for (let i = 0; i < total; i++) {
    const idx = (startIndex + i) % total;
    const p = ALL_PLANETS[idx];
    if (!usedCodes.includes(p.code) && isValidStartingPlanet(p)) {
      return p;
    }
  }

  return ALL_PLANETS[0];
}

export function roll3D6PlanetCode(manualDice?: [number, number, number]): number {
  if (manualDice) {
    return manualDice[0] * 100 + manualDice[1] * 10 + manualDice[2];
  }
  const d1 = rollDice({ diceCount: 1 }).rolls[0];
  const d2 = rollDice({ diceCount: 1 }).rolls[0];
  const d3 = rollDice({ diceCount: 1 }).rolls[0];
  return d1 * 100 + d2 * 10 + d3;
}

export function getDensityThreshold(density: 'Baja' | 'Media' | 'Alta'): number {
  if (density === 'Baja') return 9;
  if (density === 'Media') return 8;
  return 7;
}

export function configureQuadrant(
  universe: UniverseState,
  areaId: number,
  col: string,
  row: number,
  planetRollSum?: number,
  manualPlanetCode?: number
): { nextUniverse: UniverseState; planetDiscovered: PlanetData | null; hadPlanet: boolean } {
  const key = getQuadrantKey(col, row);
  const area = universe.areas[areaId];
  if (!area) throw new Error(`Área ${areaId} no existe`);

  const quad = area.quadrants[key];
  if (!quad) throw new Error(`Cuadrante ${key} inválido`);

  if (quad.isConfigured) {
    const existing = quad.planetCode ? PLANETS_BY_CODE[quad.planetCode] || null : null;
    return { nextUniverse: universe, planetDiscovered: existing, hadPlanet: quad.planetCode !== null };
  }

  const threshold = getDensityThreshold(area.density);
  const roll = planetRollSum ?? rollDice({ diceCount: 2 }).sum;
  const hasPlanet = roll >= threshold;

  let assignedPlanet: PlanetData | null = null;
  if (hasPlanet) {
    if (manualPlanetCode && PLANETS_BY_CODE[manualPlanetCode]) {
      assignedPlanet = PLANETS_BY_CODE[manualPlanetCode];
    } else {
      const candidateCode = roll3D6PlanetCode();
      let pIndex = ALL_PLANETS.findIndex(p => p.code === candidateCode);
      if (pIndex === -1) pIndex = 0;
      
      const total = ALL_PLANETS.length;
      for (let i = 0; i < total; i++) {
        const idx = (pIndex + i) % total;
        const candidate = ALL_PLANETS[idx];
        if (!universe.usedPlanetCodes.includes(candidate.code)) {
          assignedPlanet = candidate;
          break;
        }
      }
      if (!assignedPlanet) assignedPlanet = ALL_PLANETS[0];
    }
  }

  const updatedQuad: SectorQuadrant = {
    ...quad,
    isConfigured: true,
    planetCode: assignedPlanet ? assignedPlanet.code : null
  };

  const nextArea: SectorArea = {
    ...area,
    quadrants: {
      ...area.quadrants,
      [key]: updatedQuad
    },
    discoveredPlanets: assignedPlanet 
      ? [...area.discoveredPlanets, assignedPlanet.code]
      : area.discoveredPlanets
  };

  const nextUniverse: UniverseState = {
    ...universe,
    areas: {
      ...universe.areas,
      [areaId]: nextArea
    },
    usedPlanetCodes: assignedPlanet 
      ? [...universe.usedPlanetCodes, assignedPlanet.code]
      : universe.usedPlanetCodes
  };

  return { nextUniverse, planetDiscovered: assignedPlanet, hadPlanet: hasPlanet };
}
