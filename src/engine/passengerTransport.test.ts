import { describe, it, expect } from 'vitest';
import { calculatePassengerFare, transportPassengers } from './trade';
import { createInitialCompany } from './company';
import { disembarkPassengers, travelToQuadrant, createInitialUniverse } from './navigation';
import { PlanetData } from '../types/universe';
import { PLANETS_BY_CODE } from './universe';

describe('Passenger Transport Engine', () => {
  const dummyPlanet: PlanetData = {
    ...PLANETS_BY_CODE[111],
    max_passengers: 8
  };

  describe('Passenger Fare Calculations', () => {
    it('calculates fare rate based on flight attendants count (1-4 SC)', () => {
      let comp = createInitialCompany();
      // Remove all flight attendants
      comp.employees = comp.employees.filter(e => !e.position.toLowerCase().includes('auxiliar de vuelo'));

      // 0 attendants -> 1 SC / passenger
      const fare0 = calculatePassengerFare(comp, 5);
      expect(fare0.ratePerPassenger).toBe(1);
      expect(fare0.totalIncome).toBe(5);

      // 1 attendant standard -> 2 SC / passenger
      comp.employees.push({
        id: 101,
        name: 'Attendant 1',
        position: 'Auxiliar de vuelo',
        monthlySalary: 2,
        experience: 'estandar',
        morale: 'media',
        isActive: true
      });
      const fare1 = calculatePassengerFare(comp, 5);
      expect(fare1.ratePerPassenger).toBe(2);
      expect(fare1.totalIncome).toBe(10);

      // 2 attendants standard -> 3 SC / passenger
      comp.employees.push({
        id: 102,
        name: 'Attendant 2',
        position: 'Auxiliar de vuelo',
        monthlySalary: 2,
        experience: 'estandar',
        morale: 'media',
        isActive: true
      });
      const fare2 = calculatePassengerFare(comp, 5);
      expect(fare2.ratePerPassenger).toBe(3);
      expect(fare2.totalIncome).toBe(15);

      // 3 attendants standard -> 4 SC / passenger
      comp.employees.push({
        id: 103,
        name: 'Attendant 3',
        position: 'Auxiliar de vuelo',
        monthlySalary: 2,
        experience: 'estandar',
        morale: 'media',
        isActive: true
      });
      const fare3 = calculatePassengerFare(comp, 5);
      expect(fare3.ratePerPassenger).toBe(4);
      expect(fare3.totalIncome).toBe(20);
    });

    it('applies novice discount (-5 SC) and veteran bonus (+5 SC)', () => {
      let comp = createInitialCompany();
      comp.employees = [
        {
          id: 101,
          name: 'Novice Attendant',
          position: 'Auxiliar de vuelo',
          monthlySalary: 1,
          experience: 'novato',
          morale: 'media',
          isActive: true
        },
        {
          id: 102,
          name: 'Veteran Attendant',
          position: 'Auxiliar de vuelo',
          monthlySalary: 4,
          experience: 'veterano',
          morale: 'media',
          isActive: true
        }
      ];

      // 2 attendants -> rate 3 SC * 4 passengers = 12 SC base
      // -5 SC (novato) + 5 SC (veterano) = 12 SC
      const fare = calculatePassengerFare(comp, 4);
      expect(fare.ratePerPassenger).toBe(3);
      expect(fare.baseIncome).toBe(12);
      expect(fare.noviceDiscount).toBe(5);
      expect(fare.veteranBonus).toBe(5);
      expect(fare.totalIncome).toBe(12);

      // With only novice: 1 attendant -> rate 2 SC * 2 passengers = 4 SC base
      // -5 SC -> 0 SC (never negative)
      comp.employees = [comp.employees[0]];
      const fareNoviceOnly = calculatePassengerFare(comp, 2);
      expect(fareNoviceOnly.totalIncome).toBe(0);
    });
  });

  describe('Passenger Boarding & Dice Roll Outcomes', () => {
    it('handles roll < 7: half average passengers', () => {
      const comp = createInitialCompany();
      // dummyPlanet has max_passengers = 8. Roll 5 gives half = 4.
      const res = transportPassengers({
        planet: dummyPlanet,
        company: comp,
        rollTotal: 5
      });

      expect(res.passengersOffered).toBe(4);
      expect(res.passengersAccommodated).toBe(4);
      expect(res.nextCompany.ship.passengersCurrent).toBe(4);
      expect(res.nextCompany.treasury).toBeGreaterThan(comp.treasury);
    });

    it('handles roll 7-9: exact average passengers', () => {
      const comp = createInitialCompany();
      // dummyPlanet has max_passengers = 8. Roll 8 gives 8.
      const res = transportPassengers({
        planet: dummyPlanet,
        company: comp,
        rollTotal: 8
      });

      expect(res.passengersOffered).toBe(8);
      expect(res.passengersAccommodated).toBe(8);
      expect(res.nextCompany.ship.passengersCurrent).toBe(8);
    });

    it('handles roll >= 10: double average passengers bounded by ship capacity', () => {
      const comp = createInitialCompany();
      // dummyPlanet has max_passengers = 8. Roll 11 gives 16 offered.
      // Ship capacity is 10, so accommodated must be 10.
      const res = transportPassengers({
        planet: dummyPlanet,
        company: comp,
        rollTotal: 11
      });

      expect(res.passengersOffered).toBe(16);
      expect(res.passengersAccommodated).toBe(10);
      expect(res.nextCompany.ship.passengersCurrent).toBe(10);
    });

    it('updates Passenger Support Manager morale and experience', () => {
      let comp = createInitialCompany();
      comp.employees.push({
        id: 201,
        name: 'Manager',
        position: 'Responsable de soporte a pasajeros',
        monthlySalary: 4,
        experience: 'novato',
        morale: 'media',
        isActive: true
      });

      // Roll 12 with double six -> morale up and experience up
      const resCrit = transportPassengers({
        planet: dummyPlanet,
        company: comp,
        rollTotal: 12,
        isDoubleSix: true
      });

      const updatedMgr = resCrit.nextCompany.employees.find(e => e.id === 201)!;
      expect(updatedMgr.morale).toBe('alta');
      expect(updatedMgr.experience).toBe('estandar');
      expect(resCrit.moraleChanged).toBe(true);
      expect(resCrit.expChanged).toBe(true);
    });
  });

  describe('Disembarkation & Visit Restrictions', () => {
    it('disembarks passengers when ship lands on another world', () => {
      let comp = createInitialCompany();
      comp.ship.passengersCurrent = 8;

      const dis = disembarkPassengers(comp);
      expect(dis.disembarkedCount).toBe(8);
      expect(dis.nextCompany.ship.passengersCurrent).toBe(0);
    });

    it('resets passengersTakenInCurrentVisit when jumping to another quadrant', () => {
      let univ = createInitialUniverse();
      univ.passengersTakenInCurrentVisit = true;

      const nextUniv = travelToQuadrant(univ, 'B', 3);
      expect(nextUniv.passengersTakenInCurrentVisit).toBe(false);
    });
  });
});
