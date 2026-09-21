import { describe, it, expect } from 'vitest';
import { 
  dockAtSpaceport, 
  refuelShip, 
  repairShip, 
  getSpaceportRepairCapability 
} from './spaceport';
import { createInitialCompany } from './company';
import { PLANETS_BY_CODE } from './universe';
import { PlanetData } from '../types/universe';

describe('Spaceport & Shipyard Engine', () => {
  const planetMed: PlanetData = {
    ...PLANETS_BY_CODE[111],
    spaceport_quality: 'MED',
    fuel_density: 'DM',
    docking_price: 4
  };

  const planetBas: PlanetData = {
    ...PLANETS_BY_CODE[111],
    spaceport_quality: 'BAS',
    fuel_density: 'DB',
    docking_price: 2
  };

  const planetExc: PlanetData = {
    ...PLANETS_BY_CODE[111],
    spaceport_quality: 'EXC',
    fuel_density: 'DA',
    docking_price: 6
  };

  describe('Docking & Landing Maneuvers (Piloto)', () => {
    it('executes successful damage-free docking when pilot rolls >= 7', () => {
      const comp = createInitialCompany();
      const initialTreasury = comp.treasury;

      const res = dockAtSpaceport({
        company: comp,
        planet: planetMed,
        pilotRollTotal: 8
      });

      expect(res.success).toBe(true);
      expect(res.damageSuffered).toBe('ninguno');
      expect(res.dockingFee).toBe(4);
      expect(res.nextCompany.treasury).toBe(initialTreasury - 4);
      expect(res.nextCompany.ship.damageLight).toBe(0);
    });

    it('inflicts 1 light damage when pilot rolls <= 6 and severity roll is 1-5', () => {
      const comp = createInitialCompany();

      const res = dockAtSpaceport({
        company: comp,
        planet: planetMed,
        pilotRollTotal: 5,
        damageSeverityRoll: 3
      });

      expect(res.success).toBe(false);
      expect(res.damageSuffered).toBe('leve');
      expect(res.nextCompany.ship.damageLight).toBe(1);
    });

    it('inflicts 1 moderate damage when pilot rolls <= 6 and severity roll is 6', () => {
      const comp = createInitialCompany();

      const res = dockAtSpaceport({
        company: comp,
        planet: planetMed,
        pilotRollTotal: 4,
        damageSeverityRoll: 6
      });

      expect(res.success).toBe(false);
      expect(res.damageSuffered).toBe('moderado');
      expect(res.nextCompany.ship.damageModerate).toBe(1);
    });
  });

  describe('Refueling (Técnico de repostaje & Densidad)', () => {
    it('calculates fuel cost (3 SC/u), pump days by density, and dock fee (1 SC/d)', () => {
      let comp = createInitialCompany();
      comp.ship.fuelCurrent = 10; // Faltan 20 unidades (fuelMax: 30)

      // In planetExc (DA - Alta densidad -> 10 u/día):
      // 10 unidades necesitan 1 día. Coste combustible: 30 SC. Ocupación: 1 SC. Total: 31 SC.
      const res = refuelShip({
        company: comp,
        planet: planetExc,
        unitsToRefuel: 10,
        techRollTotal: 8
      });

      expect(res.unitsRefueled).toBe(10);
      expect(res.daysTaken).toBe(1);
      expect(res.fuelCost).toBe(30);
      expect(res.dockDailyCost).toBe(1);
      expect(res.totalCost).toBe(31);
      expect(res.damageSuffered).toBe('ninguno');
      expect(res.nextCompany.ship.fuelCurrent).toBe(20);
    });

    it('takes longer in low density (DB -> 1 u/día) and charges occupation accordingly', () => {
      let comp = createInitialCompany();
      comp.ship.fuelCurrent = 20;

      // In planetBas (DB -> 1 u/día): 3 unidades = 3 días.
      // Combustible: 9 SC. Ocupación: 3 SC. Total: 12 SC.
      const res = refuelShip({
        company: comp,
        planet: planetBas,
        unitsToRefuel: 3,
        techRollTotal: 8
      });

      expect(res.daysTaken).toBe(3);
      expect(res.totalCost).toBe(12);
      expect(res.nextCompany.ship.fuelCurrent).toBe(23);
    });

    it('inflicts 1 light damage if technician rolls <= 6 (impure fuel)', () => {
      let comp = createInitialCompany();
      comp.ship.fuelCurrent = 20;

      const res = refuelShip({
        company: comp,
        planet: planetMed,
        unitsToRefuel: 5,
        techRollTotal: 5 // Fallo técnico
      });

      expect(res.damageSuffered).toBe('leve');
      expect(res.nextCompany.ship.damageLight).toBe(1);
    });
  });

  describe('Shipyard Repairs (Técnico de Mantenimiento & Calidad)', () => {
    it('checks repair capabilities by spaceport quality', () => {
      const capBas = getSpaceportRepairCapability('BAS');
      expect(capBas.canRepairLight).toBe(true);
      expect(capBas.canRepairModerate).toBe(false);
      expect(capBas.canRepairHeavy).toBe(false);

      const capMed = getSpaceportRepairCapability('MED');
      expect(capMed.canRepairLight).toBe(true);
      expect(capMed.canRepairModerate).toBe(true);
      expect(capMed.canRepairHeavy).toBe(false);

      const capExc = getSpaceportRepairCapability('EXC');
      expect(capExc.canRepairLight).toBe(true);
      expect(capExc.canRepairModerate).toBe(true);
      expect(capExc.canRepairHeavy).toBe(true);
    });

    it('rejects repairing moderate damage in a basic spaceport', () => {
      let comp = createInitialCompany();
      comp.ship.damageModerate = 1;

      expect(() => {
        repairShip({
          company: comp,
          planet: planetBas, // BAS solo repara leves
          damageType: 'moderado'
        });
      }).toThrow(/limitada/);
    });

    it('halves cost and time when technician rolls >= 7', () => {
      let comp = createInitialCompany();
      comp.ship.damageModerate = 1;

      // Base moderado: 20 SC y 4 días (si tirada de días = 4)
      // Con técnico >= 7: coste 10 SC, tiempo 2 días
      const res = repairShip({
        company: comp,
        planet: planetMed,
        damageType: 'moderado',
        mechanicRollTotal: 8,
        randomDaysRoll: 4
      });

      expect(res.technicianOptimized).toBe(true);
      expect(res.cost).toBe(10);
      expect(res.daysTaken).toBe(2);
      expect(res.nextCompany.ship.damageModerate).toBe(0);
    });

    it('charges full cost and time when technician rolls <= 6', () => {
      let comp = createInitialCompany();
      comp.ship.damageLight = 1;

      // Base leve: 5 SC y 1 día
      const res = repairShip({
        company: comp,
        planet: planetMed,
        damageType: 'leve',
        mechanicRollTotal: 5
      });

      expect(res.technicianOptimized).toBe(false);
      expect(res.cost).toBe(5);
      expect(res.daysTaken).toBe(1);
      expect(res.nextCompany.ship.damageLight).toBe(0);
    });
  });
});
