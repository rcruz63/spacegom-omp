import { describe, it, expect } from 'vitest';
import { 
  createCampaignObjective1, 
  checkObjective1Progress, 
  addMission, 
  updateMissionStatus,
  OBJECTIVE_1_REQUIRED_POSITIONS 
} from './missions';
import { createInitialCompany, hireEmployee } from './company';

describe('Missions & Campaign Objectives Engine', () => {
  describe('Objective 1: Creation and Structure', () => {
    it('creates Campaign Objective 1 with required fields and status en_curso', () => {
      const obj1 = createCampaignObjective1(111, 'Chipethea');

      expect(obj1.objectiveNumber).toBe(1);
      expect(obj1.category).toBe('campana');
      expect(obj1.status).toBe('en_curso');
      expect(obj1.acceptedPlanetCode).toBe(111);
      expect(obj1.acceptedPlanetName).toBe('Chipethea');
      expect(obj1.executionLocation).toContain('Superficie de MUNDO');
    });

    it('contains all 6 mandatory positions in OBJECTIVE_1_REQUIRED_POSITIONS', () => {
      expect(OBJECTIVE_1_REQUIRED_POSITIONS).toHaveLength(6);
      expect(OBJECTIVE_1_REQUIRED_POSITIONS).toContain('Responsable de soporte a pasajeros');
      expect(OBJECTIVE_1_REQUIRED_POSITIONS).toContain('Auxiliar de vuelo');
      expect(OBJECTIVE_1_REQUIRED_POSITIONS).toContain('Negociador de compraventa de mercadería');
      expect(OBJECTIVE_1_REQUIRED_POSITIONS).toContain('Técnico de mantenimiento de astronaves');
      expect(OBJECTIVE_1_REQUIRED_POSITIONS).toContain('Técnico de soportes vitales');
      expect(OBJECTIVE_1_REQUIRED_POSITIONS).toContain('Abogado');
    });
  });

  describe('Objective 1: Progress Evaluation against Company Crew', () => {
    it('evaluates progress on starting crew: detects missing positions', () => {
      const comp = createInitialCompany();
      const progress = checkObjective1Progress(comp);

      expect(progress.isComplete).toBe(false);
      expect(progress.totalRequired).toBe(6);
      expect(progress.fulfilledCount).toBeLessThan(6);

      const missing = progress.positionsStatus.filter(p => !p.fulfilled).map(p => p.position);
      expect(missing).toContain('Responsable de soporte a pasajeros');
      expect(missing).toContain('Abogado');
    });

    it('reports isComplete = true when all 6 positions are staffed in company', () => {
      let comp = createInitialCompany();

      // Hire the 6 required roles
      for (const pos of OBJECTIVE_1_REQUIRED_POSITIONS) {
        comp = hireEmployee(comp, {
          name: `Empleado ${pos}`,
          position: pos,
          monthlySalary: 5,
          experience: 'estandar',
          morale: 'media'
        });
      }

      const progress = checkObjective1Progress(comp);
      expect(progress.isComplete).toBe(true);
      expect(progress.fulfilledCount).toBe(6);
    });
  });

  describe('Mission List Operations & Status Updates', () => {
    it('adds missions and updates their status', () => {
      const obj = createCampaignObjective1(111, 'Chipethea');
      const list = addMission([], obj);
      expect(list).toHaveLength(1);

      const updatedToSuccess = updateMissionStatus(list, obj.id, 'exito');
      expect(updatedToSuccess[0].status).toBe('exito');

      const updatedToReopened = updateMissionStatus(updatedToSuccess, obj.id, 'en_curso');
      expect(updatedToReopened[0].status).toBe('en_curso');
    });
  });
});
