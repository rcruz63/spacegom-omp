import { describe, it, expect } from 'vitest';
import { createInitialCompany } from './company';
import { ALL_PLANETS } from './universe';
import { buyGoods, sellGoods, transportPassengers } from './trade';
import { refuelShip, repairShip } from './spaceport';

describe('Trade & Operations Engine', () => {
  const planetA = ALL_PLANETS[0]; // Chipethea
  const planetB = ALL_PLANETS[1]; // Bars 87

  it('buys and sells goods with negotiation margins', () => {
    let comp = createInitialCompany();
    const initialTreasury = comp.treasury;

    // Comprar 10 UCN de ALIM (base buy = 4 SC). Tirada 8 -> factor 1.0 -> 40 SC
    const buyRes = buyGoods({
      productCode: 'ALIM',
      ucnAmount: 10,
      areaId: 2,
      planet: planetA,
      company: comp,
      negotiationRollTotal: 8
    });

    comp = buyRes.nextCompany;
    expect(buyRes.unitPrice).toBe(4);
    expect(buyRes.totalCost).toBe(40);
    expect(comp.treasury).toBe(initialTreasury - 40);
    expect(comp.ship.warehouseOccupied).toBe(10);

    // Vender 10 UCN en otro planeta con negociación alta (10) -> base sell 11 * 1.2 = 14 SC/UCN -> 140 SC
    const sellRes = sellGoods({
      order: buyRes.order,
      planet: planetB,
      company: comp,
      negotiationRollTotal: 10
    });

    comp = sellRes.nextCompany;
    expect(sellRes.unitPrice).toBe(14);
    expect(sellRes.totalRevenue).toBe(140);
    expect(sellRes.profit).toBe(100);
    expect(comp.treasury).toBe(initialTreasury - 40 + 140);
    expect(comp.ship.warehouseOccupied).toBe(0);
  });

  it('transports passengers and applies flight attendant bonuses', () => {
    const comp = createInitialCompany();
    // Starblack tiene 1 auxiliar novato (Sam Hernández)
    const res = transportPassengers(planetA, comp, 8);
    expect(res.passengersCount).toBeGreaterThan(0);
    expect(res.income).toBeGreaterThan(0);
    expect(res.nextCompany.treasury).toBeGreaterThan(comp.treasury);
  });

  it('refuels ship calculating fuel cost and dock days', () => {
    let comp = createInitialCompany();
    comp.ship.fuelCurrent = 10; // depósito tiene 10/30

    const res = refuelShip(comp, planetA, 10);
    expect(res.unitsRefueled).toBe(10);
    expect(res.nextCompany.ship.fuelCurrent).toBe(20);
    expect(res.totalCost).toBeGreaterThan(0);
  });

  it('repairs spaceship damages applying mechanic discount on success', () => {
    let comp = createInitialCompany();
    comp.ship.damageLight = 1;

    const res = repairShip(comp, 'leve', 8);
    expect(res.cost).toBe(3); // 5 / 2 = 2.5 -> ceil = 3
    expect(res.nextCompany.ship.damageLight).toBe(0);
  });
});
