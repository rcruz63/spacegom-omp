import { describe, it, expect } from 'vitest';
import { 
  createInitialCompany, 
  calculateEmployeeDiceModifier, 
  updateEmployeeAfterRoll,
  applyShipDamage,
  getTotalMonthlySalaries,
  hireEmployee,
  fireEmployee
} from './company';
import { performWeeklyAdministration, performMonthlyAdministration } from './administration';

describe('Company Engine', () => {
  it('creates initial company with tutorial default roster and settings', () => {
    const comp = createInitialCompany('Starblack', 'normal');
    expect(comp.name).toBe('Starblack');
    expect(comp.treasury).toBe(500);
    expect(comp.employees.length).toBe(11);
    expect(getTotalMonthlySalaries(comp.employees)).toBe(76);
    expect(comp.ship.fuelCurrent).toBe(20);
    expect(comp.lifeSupport.standardSuit).toBe(1);

    const facil = createInitialCompany('Starblack', 'facil');
    expect(facil.treasury).toBe(600);

    const dificil = createInitialCompany('Starblack', 'dificil');
    expect(dificil.treasury).toBe(400);
  });

  it('calculates employee dice modifiers correctly', () => {
    const emp1 = { id: 1, name: 'A', position: 'P', monthlySalary: 10, experience: 'veterano', morale: 'alta', isActive: true } as const;
    expect(calculateEmployeeDiceModifier(emp1)).toBe(2);

    const emp2 = { id: 2, name: 'B', position: 'P', monthlySalary: 10, experience: 'novato', morale: 'baja', isActive: true } as const;
    expect(calculateEmployeeDiceModifier(emp2)).toBe(-2);
  });

  it('updates employee morale and experience after roll thresholds', () => {
    const emp = { id: 1, name: 'Pilot', position: 'Piloto', monthlySalary: 10, experience: 'estandar', morale: 'media', isActive: true } as const;
    
    // Result >= 10 boosts morale
    const resHigh = updateEmployeeAfterRoll(emp, 10, false);
    expect(resHigh.updatedEmployee.morale).toBe('alta');
    expect(resHigh.moraleChanged).toBe(true);

    // Double 6 boosts experience
    const resCrit = updateEmployeeAfterRoll(emp, 12, true);
    expect(resCrit.updatedEmployee.experience).toBe('veterano');
    expect(resCrit.expChanged).toBe(true);
  });

  it('handles progressive spaceship damages', () => {
    let comp = createInitialCompany();
    comp.ship = applyShipDamage(comp.ship, 'leve');
    expect(comp.ship.damageLight).toBe(1);

    // 2 more light damages trigger 1 moderate damage
    comp.ship = applyShipDamage(comp.ship, 'leve');
    comp.ship = applyShipDamage(comp.ship, 'leve');
    expect(comp.ship.damageLight).toBe(0);
    expect(comp.ship.damageModerate).toBe(1);
    expect(comp.ship.diceModifier).toBe(-1);
  });

  it('manages hiring and firing employees', () => {
    let comp = createInitialCompany();
    const initialTotal = getTotalMonthlySalaries(comp.employees);

    comp = hireEmployee(comp, {
      name: 'Dr. John',
      position: 'Médico',
      monthlySalary: 15,
      experience: 'estandar',
      morale: 'media'
    });
    expect(comp.employees.length).toBe(12);
    expect(getTotalMonthlySalaries(comp.employees)).toBe(initialTotal + 15);

    // Fire with severance
    const fired = fireEmployee(comp, 12, true);
    expect(fired.nextCompany.employees.length).toBe(11);
    expect(fired.nextCompany.treasury).toBe(comp.treasury - (15 * 5));
  });
});

describe('Weekly & Monthly Administration', () => {
  it('performs weekly administration deducting inefficiency when vice-director is missing', () => {
    const comp = createInitialCompany();
    const weekly = performWeeklyAdministration(comp);
    // Thomas Müller is Director, no Vice-director -> -8 SC
    expect(weekly.nextCompany.treasury).toBe(492);
  });

  it('performs monthly administration deducting payroll and operational costs', () => {
    const comp = createInitialCompany();
    const monthly = performMonthlyAdministration(comp);
    expect(monthly.totalSalariesPaid).toBeGreaterThan(0);
    expect(monthly.operatingCosts).toBe(4); // Has accountant
    expect(monthly.nextCompany.treasury).toBe(comp.treasury - monthly.totalSalariesPaid - 4);
  });
});
