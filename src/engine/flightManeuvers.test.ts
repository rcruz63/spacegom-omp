import { describe, it, expect } from 'vitest';
import { 
  executePilotManeuver, 
  executeLandingManeuver, 
  executeOrbitalDockingManeuver, 
  executeTransitToHyperspace 
} from './flightManeuvers';
import { createInitialCompany } from './company';
import { createInitialUniverse } from './navigation';
import { PLANETS_BY_CODE } from './universe';
import { PlanetData } from '../types/universe';

describe('Flight Maneuvers & Pilot Navigation Engine', () => {
  const dummyPlanet: PlanetData = {
    ...PLANETS_BY_CODE[111],
    days_to_hyperspace: 7 // 7 días -> Math.ceil(7/5) = 2 fuel
  };

  describe('Pilot Maneuver Resolution', () => {
    it('executes successful damage-free maneuver on roll >= 7', () => {
      const comp = createInitialCompany();
      const res = executePilotManeuver(comp, 8, false, undefined, 'Aterrizaje');

      expect(res.success).toBe(true);
      expect(res.damageSuffered).toBe('ninguno');
      expect(res.nextCompany.ship.damageLight).toBe(0);
      expect(res.nextCompany.ship.damageModerate).toBe(0);
    });

    it('inflicts 1 light damage on roll <= 6 with severity 1-5', () => {
      const comp = createInitialCompany();
      const res = executePilotManeuver(comp, 5, false, 3, 'Aterrizaje');

      expect(res.success).toBe(false);
      expect(res.damageSuffered).toBe('leve');
      expect(res.nextCompany.ship.damageLight).toBe(1);
    });

    it('inflicts 1 moderate damage on roll <= 6 with severity 6', () => {
      const comp = createInitialCompany();
      const res = executePilotManeuver(comp, 4, false, 6, 'Aterrizaje');

      expect(res.success).toBe(false);
      expect(res.damageSuffered).toBe('moderado');
      expect(res.nextCompany.ship.damageModerate).toBe(1);
    });

    it('updates pilot morale on high roll (>= 10) and low roll (<= 4)', () => {
      let comp = createInitialCompany();
      const pilot = comp.employees.find(e => e.position.toLowerCase().includes('piloto'))!;
      expect(pilot.morale).toBe('baja');

      // High roll boosts morale from baja to media
      const resHigh = executePilotManeuver(comp, 10);
      const pilotAfterHigh = resHigh.nextCompany.employees.find(e => e.id === pilot.id)!;
      expect(pilotAfterHigh.morale).toBe('media');

      // Low roll decreases morale from media to baja
      const resLow = executePilotManeuver(resHigh.nextCompany, 3, false, 2);
      const pilotAfterLow = resLow.nextCompany.employees.find(e => e.id === pilot.id)!;
      expect(pilotAfterLow.morale).toBe('baja');
    });
  });

  describe('Landing on World & Passenger Disembarkation', () => {
    it('moves ship to mundo and disembarks passengers', () => {
      let comp = createInitialCompany();
      comp.ship.passengersCurrent = 6;
      let univ = createInitialUniverse();
      univ.currentLocation = 'estacion_hiperdisparo';

      const res = executeLandingManeuver(comp, univ, dummyPlanet, 8);

      expect(res.success).toBe(true);
      expect(res.nextUniverse.currentLocation).toBe('mundo');
      expect(res.disembarkedCount).toBe(6);
      expect(res.nextCompany.ship.passengersCurrent).toBe(0);
    });
  });

  describe('Orbital Facility Docking', () => {
    it('moves ship to instalacion_orbital', () => {
      const comp = createInitialCompany();
      let univ = createInitialUniverse();
      univ.currentLocation = 'mundo';

      const res = executeOrbitalDockingManeuver(comp, univ, dummyPlanet, 9);
      expect(res.success).toBe(true);
      expect(res.nextUniverse.currentLocation).toBe('instalacion_orbital');
    });
  });

  describe('Transit to Hyperspace Station', () => {
    it('consumes 1 fuel per 5 transit days (ceil) and moves to estacion_hiperdisparo', () => {
      let comp = createInitialCompany();
      comp.ship.fuelCurrent = 20;
      let univ = createInitialUniverse();
      univ.currentLocation = 'mundo';

      // dummyPlanet has days_to_hyperspace = 7 -> Math.ceil(7/5) = 2 fuel
      const res = executeTransitToHyperspace(comp, univ, dummyPlanet);

      expect(res.daysTaken).toBe(7);
      expect(res.fuelConsumed).toBe(2);
      expect(res.nextCompany.ship.fuelCurrent).toBe(18);
      expect(res.nextUniverse.currentLocation).toBe('estacion_hiperdisparo');
    });

    it('rejects transit if fuel is insufficient', () => {
      let comp = createInitialCompany();
      comp.ship.fuelCurrent = 1; // Needs 2
      let univ = createInitialUniverse();

      expect(() => {
        executeTransitToHyperspace(comp, univ, dummyPlanet);
      }).toThrow(/Combustible insuficiente/);
    });
  });
});
