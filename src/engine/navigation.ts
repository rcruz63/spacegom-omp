import { UniverseState, SectorArea } from '../types/universe';
import { CompanyState } from '../types/company';
import { createSectorArea, findFirstValidStartingPlanet, getQuadrantKey, PLANETS_BY_CODE } from './universe';
import { rollDice } from './dice';

export interface StartingUniverseOptions {
  manualArea?: number;
  manualDensity?: 'Baja' | 'Media' | 'Alta';
  manualCol?: string;
  manualRow?: number;
  manualPlanetCode?: number;
  customPlanets?: Record<number, any>;
}

export function createInitialUniverse(options: StartingUniverseOptions = {}): UniverseState {
  let areaId = options.manualArea;
  if (!areaId) {
    areaId = Math.max(2, Math.min(12, rollDice({ diceCount: 2 }).sum));
  }

  let density = options.manualDensity;
  if (!density) {
    const densRoll = rollDice({ diceCount: 2 }).sum;
    if (densRoll <= 4) density = 'Baja';
    else if (densRoll <= 9) density = 'Media';
    else density = 'Alta';
  }

  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const startCol = options.manualCol || cols[rollDice({ diceCount: 1 }).rolls[0] - 1];
  const startRow = options.manualRow || rollDice({ diceCount: 1 }).rolls[0];

  const candidateCode = options.manualPlanetCode || (
    rollDice({ diceCount: 1 }).rolls[0] * 100 +
    rollDice({ diceCount: 1 }).rolls[0] * 10 +
    rollDice({ diceCount: 1 }).rolls[0]
  );

  const startPlanet = findFirstValidStartingPlanet(candidateCode, [], options.customPlanets);
  const initialArea: SectorArea = createSectorArea(areaId, density);
  const startQuadKey = getQuadrantKey(startCol, startRow);

  initialArea.quadrants[startQuadKey] = {
    col: startCol,
    row: startRow,
    isConfigured: true,
    planetCode: startPlanet.code
  };
  initialArea.discoveredPlanets.push(startPlanet.code);

  return {
    currentAreaId: areaId,
    currentCol: startCol,
    currentRow: startRow,
    currentPlanetCode: startPlanet.code,
    currentLocation: 'mundo',
    areas: {
      [areaId]: initialArea
    },
    usedPlanetCodes: [startPlanet.code]
  };
}

export function moveShipLocation(
  universe: UniverseState,
  targetLocation: UniverseState['currentLocation']
): UniverseState {
  return {
    ...universe,
    currentLocation: targetLocation
  };
}

export function disembarkPassengers(company: CompanyState): {
  nextCompany: CompanyState;
  disembarkedCount: number;
} {
  const count = company.ship.passengersCurrent || 0;
  if (count === 0) return { nextCompany: company, disembarkedCount: 0 };

  return {
    nextCompany: {
      ...company,
      ship: {
        ...company.ship,
        passengersCurrent: 0
      }
    },
    disembarkedCount: count
  };
}

export function travelToQuadrant(
  universe: UniverseState,
  targetCol: string,
  targetRow: number,
  targetAreaId?: number
): UniverseState {
  const destAreaId = targetAreaId || universe.currentAreaId;
  let nextUniverse = { ...universe };

  if (!nextUniverse.areas[destAreaId]) {
    const densRoll = rollDice({ diceCount: 2 }).sum;
    const density = densRoll <= 4 ? 'Baja' : densRoll <= 9 ? 'Media' : 'Alta';
    nextUniverse.areas = {
      ...nextUniverse.areas,
      [destAreaId]: createSectorArea(destAreaId, density)
    };
  }

  const destArea = nextUniverse.areas[destAreaId];
  const destQuadKey = getQuadrantKey(targetCol, targetRow);
  const quad = destArea.quadrants[destQuadKey];

  return {
    ...nextUniverse,
    currentAreaId: destAreaId,
    currentCol: targetCol,
    currentRow: targetRow,
    currentPlanetCode: quad?.planetCode || null,
    currentLocation: 'estacion_hiperdisparo',
    passengersTakenInCurrentVisit: false
  };
}

export function getCurrentPlanet(universe: UniverseState) {
  if (!universe.currentPlanetCode) return null;
  return PLANETS_BY_CODE[universe.currentPlanetCode] || null;
}
