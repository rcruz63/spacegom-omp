import { describe, it, expect } from 'vitest';
import { 
  createInitialCompany, 
  generateInitialCrew, 
  getDifficultyTreasury, 
  getTotalMonthlySalaries 
} from './company';
import { 
  validateStartingPlanet, 
  findConsecutiveStartingPlanet, 
  PLANETS_BY_CODE, 
  ALL_PLANETS 
} from './universe';
import { createNewGame } from './storage';
import { COMPANY_NAMES, SHIP_NAMES, PERSONNEL_NAMES, getUniqueRandomItems } from '../data/names';

describe('Game Setup Engine & Rules Verification', () => {
  describe('Company & Difficulty Initialization', () => {
    it('sets correct starting treasury per difficulty level: Fácil 600, Normal 500, Difícil 400', () => {
      expect(getDifficultyTreasury('facil')).toBe(600);
      expect(getDifficultyTreasury('normal')).toBe(500);
      expect(getDifficultyTreasury('dificil')).toBe(400);

      const compFacil = createInitialCompany('MegaCorp', 'facil');
      expect(compFacil.treasury).toBe(600);

      const compNormal = createInitialCompany('MegaCorp', 'normal');
      expect(compNormal.treasury).toBe(500);

      const compDificil = createInitialCompany('MegaCorp', 'dificil');
      expect(compDificil.treasury).toBe(400);
    });

    it('generates 11 initial employees whose salaries sum exactly to 76 SC/month', () => {
      const crew = generateInitialCrew();
      expect(crew.length).toBe(11);
      
      const totalSalary = getTotalMonthlySalaries(crew);
      expect(totalSalary).toBe(76);

      // Verify specific roles and positions
      const positions = crew.map(c => c.position);
      expect(positions).toContain('Director gerente');
      expect(positions).toContain('Comandante de hipersaltos');
      expect(positions).toContain('Piloto');
      expect(positions).toContain('Ingeniero computacional');
      expect(positions).toContain('Responsable de contabilidad y burocracia');
      expect(positions).toContain('Responsable de suministros de manutención');
      expect(positions).toContain('Cocinero');
      expect(positions).toContain('Asistente doméstico');
    });

    it('assigns unique non-repeated names from dataset', () => {
      const uniqueNames = getUniqueRandomItems(PERSONNEL_NAMES, 11);
      expect(uniqueNames.length).toBe(11);
      
      const uniqueSet = new Set(uniqueNames);
      expect(uniqueSet.size).toBe(11);

      const comp = createInitialCompany({
        name: 'Nexus Corp',
        shipName: 'Nostromo',
        difficulty: 'facil',
        crewNames: uniqueNames
      });

      expect(comp.name).toBe('Nexus Corp');
      expect(comp.ship.name).toBe('Nostromo');
      expect(comp.treasury).toBe(600);
      expect(comp.employees.map(e => e.name)).toEqual(uniqueNames);
    });

    it('loads name lists properly from CSV datasets', () => {
      expect(COMPANY_NAMES.length).toBeGreaterThanOrEqual(400);
      expect(SHIP_NAMES.length).toBeGreaterThanOrEqual(400);
      expect(PERSONNEL_NAMES.length).toBeGreaterThanOrEqual(900);
    });
  });

  describe('Starting Planet Validation & Consecutive Search', () => {
    it('validates planet criteria: population > 1000, tech, life support, convenio, and products', () => {
      // Planet 111 (Chipethea) is a known valid starting planet
      const p111 = PLANETS_BY_CODE[111];
      expect(p111).toBeDefined();

      const val111 = validateStartingPlanet(p111);
      expect(val111.isValid).toBe(true);
      expect(val111.checks.population.passed).toBe(true);
      expect(val111.checks.technology.passed).toBe(true);
      expect(val111.checks.lifeSupport.passed).toBe(true);
      expect(val111.checks.convenio.passed).toBe(true);
      expect(val111.checks.products.passed).toBe(true);
    });

    it('rejects planets missing convenio or products, or with advanced life support', () => {
      // Planet 122 (Gnonoe GZ42) has no products and no convenio
      const p122 = PLANETS_BY_CODE[122];
      if (p122) {
        const val122 = validateStartingPlanet(p122);
        expect(val122.isValid).toBe(false);
        expect(val122.reasons.length).toBeGreaterThan(0);
      }
    });

    it('executes consecutive search (111 -> 112 -> 113...) automatically when a planet is not valid', () => {
      // Find an invalid planet code
      let invalidCode = 112;
      for (const p of ALL_PLANETS) {
        if (!validateStartingPlanet(p).isValid) {
          invalidCode = p.code;
          break;
        }
      }

      const search = findConsecutiveStartingPlanet(invalidCode);
      expect(search.initialCode).toBe(invalidCode);
      expect(search.initialValidation.isValid).toBe(false);
      expect(search.finalPlanet).toBeDefined();
      expect(validateStartingPlanet(search.finalPlanet).isValid).toBe(true);
      expect(search.stepsCount).toBeGreaterThan(0);
    });

    it('allows updating planet data dynamically from setup', () => {
      // Create a modified planet that satisfies criteria
      const base = PLANETS_BY_CODE[112];
      const customPlanet = {
        ...base,
        convenio_spacegom: 1,
        population_over_1000: 1,
        product_indu: 1
      };

      const search = findConsecutiveStartingPlanet(112, [], { [112]: customPlanet });
      expect(search.finalPlanet.code).toBe(112);
      expect(search.finalPlanet.product_indu).toBe(1);
    });
  });

  describe('Full Game Creation Integration', () => {
    it('creates a complete game with custom setup parameters and logs it to auditLog', () => {
      const game = createNewGame({
        saveName: 'Campaña Orión',
        companyName: 'Stellar Logistics',
        shipName: 'Millennium Falcon',
        difficulty: 'facil',
        areaId: 7,
        density: 'Alta',
        col: 'D',
        row: 5,
        planetCode: 111,
        crewNames: getUniqueRandomItems(PERSONNEL_NAMES, 11)
      });

      expect(game.name).toBe('Campaña Orión');
      expect(game.company.name).toBe('Stellar Logistics');
      expect(game.company.ship.name).toBe('Millennium Falcon');
      expect(game.company.treasury).toBe(600);
      expect(game.company.employees.length).toBe(11);
      expect(getTotalMonthlySalaries(game.company.employees)).toBe(76);

      expect(game.universe.currentAreaId).toBe(7);
      expect(game.universe.currentCol).toBe('D');
      expect(game.universe.currentRow).toBe(5);
      expect(game.universe.currentPlanetCode).toBe(111);
      expect(game.universe.areas[7].density).toBe('Alta');

      expect(game.auditLog.length).toBeGreaterThan(0);
      expect(game.auditLog[0].details).toContain('Stellar Logistics');
      expect(game.auditLog[0].details).toContain('Millennium Falcon');
      expect(game.auditLog[0].details).toContain('600 SC');
      expect(game.auditLog[0].details).toContain('76 SC/mes');
    });
  });
});
