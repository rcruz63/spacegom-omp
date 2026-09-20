import { describe, it, expect } from 'vitest';
import { ALL_PLANETS, configureQuadrant, PLANETS_BY_CODE } from './universe';
import { createInitialUniverse, moveShipLocation, travelToQuadrant } from './navigation';

describe('Universe & Navigation Engine', () => {
  it('loads 216 planets from database', () => {
    expect(ALL_PLANETS.length).toBe(216);
    expect(PLANETS_BY_CODE[111]).toBeDefined();
    expect(PLANETS_BY_CODE[111].name).toBe('Chipethea');
  });

  it('generates a valid initial universe matching tutorial requirements', () => {
    const univ = createInitialUniverse({
      manualArea: 8,
      manualDensity: 'Media',
      manualCol: 'C',
      manualRow: 4
    });

    expect(univ.currentAreaId).toBe(8);
    expect(univ.currentCol).toBe('C');
    expect(univ.currentRow).toBe(4);
    expect(univ.currentLocation).toBe('mundo');
    expect(univ.currentPlanetCode).not.toBeNull();

    const startPlanet = PLANETS_BY_CODE[univ.currentPlanetCode!];
    expect(startPlanet.population_over_1000).toBe(1);
    expect(startPlanet.convenio_spacegom).toBe(1);
  });

  it('configures new quadrants with deterministic planet detection', () => {
    const univ = createInitialUniverse({
      manualArea: 5,
      manualDensity: 'Media',
      manualCol: 'A',
      manualRow: 1
    });

    // In 'Media' density, threshold is 8. Sum 9 means planet found.
    const confResult = configureQuadrant(univ, 5, 'A', 2, 9, 114);
    expect(confResult.hadPlanet).toBe(true);
    expect(confResult.planetDiscovered?.code).toBe(114);

    const quad = confResult.nextUniverse.areas[5].quadrants['A2'];
    expect(quad.isConfigured).toBe(true);
    expect(quad.planetCode).toBe(114);

    // Sum 5 means no planet
    const emptyResult = configureQuadrant(confResult.nextUniverse, 5, 'A', 3, 5);
    expect(emptyResult.hadPlanet).toBe(false);
    expect(emptyResult.planetDiscovered).toBeNull();
  });

  it('handles movement between locations and sectors', () => {
    let univ = createInitialUniverse({
      manualArea: 3,
      manualCol: 'B',
      manualRow: 2
    });

    univ = moveShipLocation(univ, 'estacion_hiperdisparo');
    expect(univ.currentLocation).toBe('estacion_hiperdisparo');

    univ = travelToQuadrant(univ, 'D', 5);
    expect(univ.currentCol).toBe('D');
    expect(univ.currentRow).toBe(5);
    expect(univ.currentLocation).toBe('estacion_hiperdisparo');
  });
});
