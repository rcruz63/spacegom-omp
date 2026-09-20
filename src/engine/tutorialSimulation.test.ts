import { describe, it, expect } from 'vitest';
import { createInitialCompany, hireEmployee } from './company';
import { createInitialUniverse, moveShipLocation, travelToQuadrant, getCurrentPlanet } from './navigation';
import { createInitialDate, advanceDays } from './calendar';
import { configureQuadrant, PLANETS_BY_CODE } from './universe';
import { buyGoods, sellGoods, transportPassengers } from './trade';
import { refuelShip } from './spaceport';
import { performMonthlyAdministration } from './administration';

describe('Spacegom Tutorial Walkthrough Simulation', () => {
  it('executes the full tutorial flow step-by-step maintaining exact gamebook rules', () => {
    // 1. Iniciar partida: Día 1 Mes 1 Año 2880, Tesorería 400 SC (dificultad normal)
    let date = createInitialDate(2880, 1, 1);
    let company = createInitialCompany('Starblack', 'normal');

    expect(company.treasury).toBe(400);
    expect(company.reputation).toBe(0);
    expect(company.employees.length).toBe(11);
    expect(company.ship.fuelCurrent).toBe(20);
    expect(company.ship.warehouseOccupied).toBe(0);

    // 2. Establecer universo inicial según el tutorial:
    // Área inicial determinada con 2D6, densidad, cuadrante inicial C4, planeta inicial validado
    let universe = createInitialUniverse({
      manualArea: 8,
      manualDensity: 'Media',
      manualCol: 'C',
      manualRow: 4
    });

    expect(universe.currentAreaId).toBe(8);
    expect(universe.currentCol).toBe('C');
    expect(universe.currentRow).toBe(4);
    expect(universe.currentLocation).toBe('mundo');

    const startPlanet = getCurrentPlanet(universe);
    expect(startPlanet).not.toBeNull();
    expect(startPlanet!.population_over_1000).toBe(1);
    expect(startPlanet!.convenio_spacegom).toBe(1);

    // 3. Contratación requerida por el tutorial para el primer objetivo de campaña:
    // Al menos 1 responsable de pasajeros, 1 negociador de compraventa, 1 técnico mantenimiento, 1 abogado...
    // Starblack ya cuenta con plantilla base pero contratamos un Responsable de Pasajeros y un Abogado para completar:
    company = hireEmployee(company, {
      name: 'Elena Rostova',
      position: 'Responsable de soporte a pasajeros',
      monthlySalary: 4,
      experience: 'estandar',
      morale: 'media'
    });

    company = hireEmployee(company, {
      name: 'Marcus Vance',
      position: 'Abogado',
      monthlySalary: 10,
      experience: 'estandar',
      morale: 'media'
    });

    expect(company.employees.length).toBe(13);

    // 4. Moverse a la Estación de Hiperdisparo para configurar cuadrantes adyacentes
    universe = moveShipLocation(universe, 'estacion_hiperdisparo');
    expect(universe.currentLocation).toBe('estacion_hiperdisparo');

    // 5. Configurar cuadrantes de la zona (Objetivo 2 de campaña: al menos 10 cuadrantes)
    // El ingeniero computacional configura cuadrante C3 y C5
    const conf1 = configureQuadrant(universe, 8, 'C', 3, 9, 114);
    universe = conf1.nextUniverse;
    expect(universe.areas[8].quadrants['C3'].isConfigured).toBe(true);

    const conf2 = configureQuadrant(universe, 8, 'C', 5, 8, 115);
    universe = conf2.nextUniverse;
    expect(universe.areas[8].quadrants['C5'].isConfigured).toBe(true);

    // 6. Efectuar Hipersalto a C3 (Estación de Hiperdisparo de C3)
    // Consume 1 de combustible y 1 día de viaje
    company.ship.fuelCurrent -= 1;
    date = advanceDays(date, 1).newDate;
    universe = travelToQuadrant(universe, 'C', 3);

    expect(universe.currentCol).toBe('C');
    expect(universe.currentRow).toBe(3);
    expect(company.ship.fuelCurrent).toBe(19);

    // 7. Descender a la superficie del planeta 114 en C3 para comerciar
    universe = moveShipLocation(universe, 'mundo');
    const planet114 = PLANETS_BY_CODE[114];
    expect(planet114).toBeDefined();

    // 8. Embarcar pasajeros en el planeta (ingreso por adelantado)
    const passRes = transportPassengers(planet114, company, 8);
    company = passRes.nextCompany;
    expect(passRes.income).toBeGreaterThan(0);
    expect(company.treasury).toBeGreaterThan(400);

    // 9. Comprar mercancías (10 UCN de ALIM)
    const buyRes = buyGoods({
      productCode: 'ALIM',
      ucnAmount: 10,
      areaId: 8,
      planet: planet114,
      company,
      negotiationRollTotal: 8
    });
    company = buyRes.nextCompany;
    expect(company.ship.warehouseOccupied).toBe(10);
    expect(buyRes.totalCost).toBe(40);

    // 10. Hipersalto a C5 para vender la mercancía en el planeta 115
    company.ship.fuelCurrent -= 1;
    date = advanceDays(date, 1).newDate;
    universe = travelToQuadrant(universe, 'C', 5);
    universe = moveShipLocation(universe, 'mundo');

    const planet115 = PLANETS_BY_CODE[115];
    const sellRes = sellGoods({
      order: buyRes.order,
      planet: planet115,
      company,
      negotiationRollTotal: 10
    });
    company = sellRes.nextCompany;
    expect(company.ship.warehouseOccupied).toBe(0);
    expect(sellRes.profit).toBeGreaterThan(0);

    // 11. Operación en Espaciopuerto: Repostar combustible consumido
    universe = moveShipLocation(universe, 'espaciopuerto');
    const refuelRes = refuelShip(company, planet115, 2);
    company = refuelRes.nextCompany;
    date = advanceDays(date, refuelRes.daysTaken).newDate;
    expect(company.ship.fuelCurrent).toBe(20);

    // 12. Avance temporal hasta fin de mes (Día 28) ejecutando administración semanal y mensual
    const daysToMonthEnd = 28 - date.day;
    const advMonth = advanceDays(date, daysToMonthEnd);
    date = advMonth.newDate;

    expect(date.day).toBe(28);
    expect(advMonth.isMonthlyAdminDue).toBe(true);

    // Ejecutar administración mensual completa (pago de nóminas, gastos de burocracia, litigios)
    const monthlyRes = performMonthlyAdministration(company);
    company = monthlyRes.nextCompany;

    expect(monthlyRes.totalSalariesPaid).toBeGreaterThan(0);
    expect(monthlyRes.operatingCosts).toBe(4); // Resp. contabilidad presente
    expect(company.treasury).toBeDefined();
  });
});
